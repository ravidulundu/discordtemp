/**
 * Discord Developer Community Template Deployer
 * Bu script, template'i Discord sunucusuna yükler.
 *
 * Gereksinimler:
 *     npm install discord.js
 *
 * Kullanım:
 *     node deploy_template.js YOUR_BOT_TOKEN
 */

const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');

class TemplateDeployer {
    constructor(token, templateFile = 'vibe-coding-template.json') {
        this.token = token;
        this.templateFile = templateFile;
        this.template = null;
        this.guild = null;
        this.roleMap = new Map();
        this.channelMap = new Map();

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers
            ]
        });

        this.setupEvents();
    }

    loadTemplate() {
        try {
            const data = fs.readFileSync(this.templateFile, 'utf8');
            this.template = JSON.parse(data);
            console.log(`✅ Template yüklendi: ${this.template.name}`);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`❌ Template dosyası bulunamadı: ${this.templateFile}`);
            } else {
                console.log(`❌ Template yüklenirken hata: ${error.message}`);
            }
            return false;
        }
    }

    setupEvents() {
        this.client.once('ready', async () => {
            console.log(`✅ Bot giriş yaptı: ${this.client.user.tag}`);
            console.log('🚀 Sunucu oluşturuluyor...\n');

            try {
                await this.createServer();

                console.log('\n✅ Sunucu başarıyla oluşturuldu!');
                console.log(`📋 Sunucu Adı: ${this.guild.name}`);
                console.log(`🆔 Sunucu ID: ${this.guild.id}`);
                console.log('🔗 Davet Linki Oluşturuluyor...');

                // İlk metin kanalına davet linki oluştur
                const firstTextChannel = this.guild.channels.cache.find(
                    ch => ch.type === ChannelType.GuildText
                );

                if (firstTextChannel) {
                    const invite = await firstTextChannel.createInvite({
                        maxAge: 0,
                        maxUses: 0
                    });
                    console.log(`🔗 Davet Linki: ${invite.url}`);
                }

                await this.client.destroy();
                process.exit(0);
            } catch (error) {
                console.error('❌ Sunucu oluşturulurken hata:', error);
                process.exit(1);
            }
        });
    }

    async createServer() {
        // Yeni sunucu oluştur
        this.guild = await this.client.guilds.create(this.template.name);
        console.log(`✅ Sunucu oluşturuldu: ${this.guild.name}`);

        // Varsayılan kanalları sil
        const defaultChannels = this.guild.channels.cache;
        for (const [, channel] of defaultChannels) {
            try {
                await channel.delete();
            } catch (error) {
                // Silme hatası göz ardı edilebilir
            }
        }

        // Rolleri oluştur
        await this.createRoles();

        // Kategorileri ve kanalları oluştur
        await this.createChannels();

        // Sunucu ayarlarını yapılandır
        await this.configureServer();
    }

    async createRoles() {
        console.log('\n📝 Roller oluşturuluyor...');

        for (const roleData of this.template.roles) {
            if (roleData.name === '@everyone') {
                // @everyone rolünü güncelle
                const everyoneRole = this.guild.roles.everyone;
                this.roleMap.set(roleData.id, everyoneRole);
                await everyoneRole.setPermissions(BigInt(roleData.permissions));
                console.log('  ✓ @everyone rolü güncellendi');
            } else {
                // Yeni rol oluştur
                const role = await this.guild.roles.create({
                    name: roleData.name,
                    permissions: BigInt(roleData.permissions),
                    color: roleData.color,
                    hoist: roleData.hoist,
                    mentionable: roleData.mentionable
                });
                this.roleMap.set(roleData.id, role);
                console.log(`  ✓ ${role.name} oluşturuldu`);
            }
        }
    }

    async createChannels() {
        console.log('\n📁 Kategoriler ve kanallar oluşturuluyor...');

        // Önce kategorileri oluştur
        const categories = this.template.channels.filter(ch => ch.type === 4);
        for (const categoryData of categories) {
            const overwrites = this.getPermissionOverwrites(categoryData.permission_overwrites || []);

            const category = await this.guild.channels.create({
                name: categoryData.name,
                type: ChannelType.GuildCategory,
                permissionOverwrites: overwrites,
                position: categoryData.position
            });

            this.channelMap.set(categoryData.id, category);
            console.log(`  ✓ Kategori: ${category.name}`);
        }

        // Sonra kanalları oluştur
        const textChannels = this.template.channels.filter(ch => ch.type === 0);
        const voiceChannels = this.template.channels.filter(ch => ch.type === 2);
        const allChannels = [...textChannels, ...voiceChannels].sort((a, b) => a.position - b.position);

        for (const channelData of allChannels) {
            await this.createChannel(channelData);
        }
    }

    async createChannel(channelData) {
        const parent = channelData.parent_id ? this.channelMap.get(channelData.parent_id) : null;
        const overwrites = this.getPermissionOverwrites(channelData.permission_overwrites || []);

        const channelOptions = {
            name: channelData.name,
            parent: parent,
            permissionOverwrites: overwrites,
            position: channelData.position
        };

        let channel;
        if (channelData.type === 0) {
            // Text channel
            channelOptions.type = ChannelType.GuildText;
            channelOptions.topic = channelData.topic || '';
            channel = await this.guild.channels.create(channelOptions);
            console.log(`    ✓ Metin kanalı: #${channel.name}`);
        } else if (channelData.type === 2) {
            // Voice channel
            channelOptions.type = ChannelType.GuildVoice;
            channel = await this.guild.channels.create(channelOptions);
            console.log(`    ✓ Ses kanalı: 🔊 ${channel.name}`);
        }

        this.channelMap.set(channelData.id, channel);
    }

    getPermissionOverwrites(overwritesData) {
        const overwrites = [];

        for (const overwrite of overwritesData) {
            const targetId = overwrite.id;

            // Rolü bul
            if (this.roleMap.has(targetId)) {
                const target = this.roleMap.get(targetId);

                overwrites.push({
                    id: target.id,
                    allow: BigInt(overwrite.allow || 0),
                    deny: BigInt(overwrite.deny || 0)
                });
            }
        }

        return overwrites;
    }

    async configureServer() {
        console.log('\n⚙️ Sunucu ayarları yapılandırılıyor...');

        const editOptions = {};

        // AFK kanalını ayarla
        if (this.template.afk_channel_id) {
            const afkChannel = this.channelMap.get(this.template.afk_channel_id);
            if (afkChannel) {
                editOptions.afkChannel = afkChannel;
                editOptions.afkTimeout = 300;
                console.log(`  ✓ AFK kanalı ayarlandı: ${afkChannel.name}`);
            }
        }

        // Sistem kanalını ayarla
        if (this.template.system_channel_id) {
            const systemChannel = this.channelMap.get(this.template.system_channel_id);
            if (systemChannel) {
                editOptions.systemChannel = systemChannel;
                console.log(`  ✓ Sistem kanalı ayarlandı: ${systemChannel.name}`);
            }
        }

        // Doğrulama seviyesini ayarla
        editOptions.verificationLevel = this.template.verification_level || 0;
        editOptions.defaultMessageNotifications = this.template.default_message_notifications || 0;
        editOptions.explicitContentFilter = this.template.explicit_content_filter || 0;

        await this.guild.edit(editOptions);
        console.log('  ✓ Doğrulama seviyesi ve bildirim ayarları yapılandırıldı');
    }

    async run() {
        if (!this.loadTemplate()) {
            return false;
        }

        try {
            await this.client.login(this.token);
            return true;
        } catch (error) {
            console.error('❌ Bot giriş yapamadı:', error.message);
            return false;
        }
    }
}

// Ana fonksiyon
function main() {
    console.log('='.repeat(60));
    console.log('Discord Developer Community Template Deployer');
    console.log('='.repeat(60));
    console.log();

    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Kullanım: node deploy_template.js YOUR_BOT_TOKEN');
        console.log();
        console.log('Bot token\'ı Discord Developer Portal\'dan alabilirsiniz:');
        console.log('https://discord.com/developers/applications');
        process.exit(1);
    }

    const token = args[0];
    const deployer = new TemplateDeployer(token);
    deployer.run();
}

// Script doğrudan çalıştırılıyorsa main fonksiyonunu çağır
if (require.main === module) {
    main();
}

module.exports = TemplateDeployer;
