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
    constructor(token, guildId, templateFile = 'vibe-coding-template.json') {
        this.token = token;
        this.guildId = guildId;
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
            console.log('🚀 Sunucu yapılandırılıyor...\n');

            try {
                await this.setupServer();

                console.log('\n✅ Sunucu başarıyla yapılandırıldı!');
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

    async setupServer() {
        // Mevcut sunucuyu al
        this.guild = await this.client.guilds.fetch(this.guildId);
        console.log(`✅ Sunucu bulundu: ${this.guild.name}`);
        console.log(`📋 Mevcut kanalları siliyorum...\n`);

        // Varsayılan kanalları sil
        const defaultChannels = this.guild.channels.cache;
        for (const [, channel] of defaultChannels) {
            try {
                await channel.delete();
                console.log(`  🗑️ ${channel.name} silindi`);
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

        // Hoşgeldin ve kurallar mesajlarını gönder
        await this.sendWelcomeMessages();
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

    async sendWelcomeMessages() {
        console.log('\n📨 Hoşgeldin ve kurallar mesajları gönderiliyor...');

        // Hoşgeldin kanalını bul
        const welcomeChannel = this.guild.channels.cache.find(ch => ch.name === '📢┃hoşgeldin');
        if (welcomeChannel) {
            const welcomeMessage = {
                embeds: [{
                    color: 0x3498db,
                    title: '👋 Dulundu.dev Vibe Coding Topluluğu\'na Hoş Geldin!',
                    description: 'Türkiye\'nin en vibe\'lı yazılım topluluğuna katıldığın için mutluyuz! 🎉',
                    fields: [
                        {
                            name: '🎯 Burası Senin İçin',
                            value: '• Kod yazmayı öğrenmek\n• Projeler geliştirmek\n• Deneyim paylaşmak\n• Yeni arkadaşlar edinmek\n• Kariyer fırsatları keşfetmek'
                        },
                        {
                            name: '🚀 İlk Adımlar',
                            value: '1️⃣ <#' + this.guild.channels.cache.find(ch => ch.name === '📜┃kurallar')?.id + '> kanalını okuyun\n' +
                                   '2️⃣ <#' + this.guild.channels.cache.find(ch => ch.name === '🎯┃rol-seçimi')?.id + '> kanalından rollerinizi seçin\n' +
                                   '3️⃣ <#' + this.guild.channels.cache.find(ch => ch.name === '👋┃tanışma')?.id + '> kanalında kendinizi tanıtın\n' +
                                   '4️⃣ <#' + this.guild.channels.cache.find(ch => ch.name === '💭┃genel-sohbet')?.id + '> kanalında sohbete katılın'
                        },
                        {
                            name: '💡 İpucu',
                            value: 'Sorularınız için doğru kanalları kullanın. Yardıma ihtiyacınız varsa <#' +
                                   this.guild.channels.cache.find(ch => ch.name === '🆘┃yardım')?.id + '> kanalına gelin!'
                        }
                    ],
                    footer: {
                        text: 'Dulundu.dev Vibe Coding • Kod yazarken eğlenin! 🎨'
                    },
                    timestamp: new Date()
                }]
            };
            await welcomeChannel.send(welcomeMessage);
            console.log('  ✓ Hoşgeldin mesajı gönderildi');
        }

        // Kurallar kanalını bul
        const rulesChannel = this.guild.channels.cache.find(ch => ch.name === '📜┃kurallar');
        if (rulesChannel) {
            const rulesMessage = {
                embeds: [{
                    color: 0xe74c3c,
                    title: '📜 SUNUCU KURALLARI',
                    description: 'Dulundu.dev Vibe Coding topluluğunda herkesin güvenli ve keyifli vakit geçirmesi için lütfen aşağıdaki kuralları okuyun ve uygulayın.',
                    fields: [
                        {
                            name: '1️⃣ Saygılı ve Nazik Olun',
                            value: '• Herkese karşı saygılı, kibar ve anlayışlı olun\n• Hakaret, aşağılama, küfür veya taciz kesinlikle yasaktır\n• Yapıcı eleştiriler yapın, kırıcı olmayın\n• Farklı görüşlere ve deneyim seviyelerine saygı gösterin'
                        },
                        {
                            name: '2️⃣ Spam ve Flood Yasaktır',
                            value: '• Gereksiz tekrar mesaj atmayın\n• CAPS LOCK kullanarak yazmayın\n• Emoji ve sticker spam\'i yapmayın\n• Bot komutlarını sadece <#' + this.guild.channels.cache.find(ch => ch.name === '🤖┃bot-komutları')?.id + '> kanalında kullanın'
                        },
                        {
                            name: '3️⃣ Doğru Kanalları Kullanın',
                            value: '• Her konu için uygun kanalı kullanın\n• Python soruları → <#' + this.guild.channels.cache.find(ch => ch.name === '🐍┃python')?.id + '>\n• JavaScript soruları → <#' + this.guild.channels.cache.find(ch => ch.name === '💛┃javascript')?.id + '>\n• Proje paylaşımı → <#' + this.guild.channels.cache.find(ch => ch.name === '🎨┃proje-vitrini')?.id + '>\n• Meme\'ler → <#' + this.guild.channels.cache.find(ch => ch.name === '😂┃meme')?.id + '>'
                        },
                        {
                            name: '4️⃣ Reklam ve Link Paylaşımı',
                            value: '• İzinsiz sunucu reklamı yasaktır\n• Davet linkleri paylaşmayın\n• Faydalı kaynak linkleri <#' + this.guild.channels.cache.find(ch => ch.name === '🔗┃faydalı-linkler')?.id + '> kanalında paylaşılabilir\n• İş ilanları sadece <#' + this.guild.channels.cache.find(ch => ch.name === '💼┃iş-ilanları')?.id + '> kanalında'
                        },
                        {
                            name: '5️⃣ Ayrımcılık ve Nefret Söylemi KESİNLİKLE YASAKTIR',
                            value: '• **Irkçılık, cinsiyet ayrımcılığı, homofobia, transfobia YASAK**\n• Etnik köken, din, cinsiyet, cinsel yönelim, engellilik nedeniyle ayrımcılık yasak\n• Nefret söylemi ve gruplara yönelik hakaret yasak\n• **İhlal durumunda DERHAL BAN**\n• Bu kural için tolerans gösterilmez!'
                        },
                        {
                            name: '6️⃣ Politika ve Din',
                            value: '• Politik tartışmalar yasaktır\n• Siyasi parti/lider propagandası yasak\n• Dini tartışmalar ve misyonerlik yasak\n• Gündem konuları yerine kodlamaya odaklanın\n• Bu konular topluluk barışını bozar'
                        },
                        {
                            name: '7️⃣ Uygun İçerik',
                            value: '• NSFW (Not Safe For Work) içerik kesinlikle yasak\n• Şiddet, gore, kan içeren medya yasak\n• Telif hakkı korumalı içerikleri paylaşmayın\n• Korsan yazılım/crack linklerini paylaşmayın\n• Dolandırıcılık, illegal aktivite yasak'
                        },
                        {
                            name: '8️⃣ Hesap ve Güvenlik',
                            value: '• Fake/çoklu hesap kullanmayın\n• Başkalarının hesaplarını taklit etmeyin\n• Kişisel bilgilerinizi paylaşmayın\n• Şüpheli linklere tıklamayın ve paylaşmayın'
                        },
                        {
                            name: '9️⃣ Yardımlaşma',
                            value: '• Sorular net ve açık olmalı, ekran görüntüsü ekleyin\n• "Çalışmıyor" demek yerine hatayı ve kodu paylaşın\n• Yardım aldığınızda teşekkür edin\n• Ödev/proje sorularında hazır kod istemeyin, öğrenmeye çalışın'
                        },
                        {
                            name: '🔟 Dil',
                            value: '• Ana dil Türkçe\'dir\n• İngilizce kaynak/kod paylaşabilirsiniz\n• Anlaşılır Türkçe kullanın, yazım kurallarına dikkat edin'
                        },
                        {
                            name: '⚠️ Kural İhlalleri ve Cezalar',
                            value: '**Genel İhlaller:**\n' +
                                   '• 1. İhlal: Uyarı\n' +
                                   '• 2. İhlal: Geçici susturma (timeout)\n' +
                                   '• 3. İhlal: Sunucudan atılma (kick)\n' +
                                   '• 4. İhlal: Kalıcı ban\n\n' +
                                   '**CİDDİ İHLALLER (Direkt Ban):**\n' +
                                   '• ❌ Irkçılık, ayrımcılık, nefret söylemi\n' +
                                   '• ❌ Taciz, tehdit, doxxing\n' +
                                   '• ❌ NSFW içerik paylaşımı\n' +
                                   '• ❌ Spam/raid saldırısı\n\n' +
                                   'Moderatörler duruma göre karar verir.'
                        },
                        {
                            name: '💡 Moderatör Yardımı',
                            value: 'Sorun yaşarsanız moderatörlere <@&' + this.roleMap.get('3')?.id + '> mention ile ulaşabilirsiniz.'
                        }
                    ],
                    footer: {
                        text: 'Bu kurallar Discord Topluluk Kuralları ile uyumludur • Son güncelleme'
                    },
                    timestamp: new Date()
                }]
            };
            await rulesChannel.send(rulesMessage);
            console.log('  ✓ Kurallar mesajı gönderildi');

            // Discord'un Community Guidelines linkini de ekle
            await rulesChannel.send({
                content: '📖 **Discord Topluluk Kuralları:** https://discord.com/guidelines\n🔒 **Gizlilik Politikası:** https://discord.com/privacy'
            });
            console.log('  ✓ Discord kuralları linki eklendi');
        }

        // Rol seçimi kanalına mesaj
        const roleChannel = this.guild.channels.cache.find(ch => ch.name === '🎯┃rol-seçimi');
        if (roleChannel) {
            const roleMessage = {
                embeds: [{
                    color: 0x9b59b6,
                    title: '🎯 Rol Seçimi',
                    description: 'İlgilendiğiniz teknolojilere göre rol seçebilirsiniz!\n\n' +
                                 '**Nasıl Rol Alırım?**\n' +
                                 'Şu an için moderatörlerden rol isteyebilirsiniz. Yakında reaksiyon rol sistemi eklenecek! 🚀',
                    fields: [
                        {
                            name: '💻 Developer Rolleri',
                            value: '• 💻 **Developer** - Aktif yazılımcılar\n' +
                                   '• ⭐ **Kıdemli Developer** - Deneyimli geliştiriciler\n' +
                                   '• 🌱 **Yeni Başlayan** - Yeni öğrenenler'
                        },
                        {
                            name: '🎨 Özel Roller',
                            value: '• 🎨 **Tasarımcı** - UI/UX tasarımcılar\n' +
                                   '• 🚀 **Aktif Üye** - Toplulukta aktif olanlar'
                        },
                        {
                            name: '📚 Teknoloji Rolleri (Yakında)',
                            value: '• Python, JavaScript, Java, C++\n' +
                                   '• Frontend, Backend, Full Stack\n' +
                                   '• Mobile, Game Dev, DevOps'
                        }
                    ],
                    footer: {
                        text: 'Moderatörlere mention yaparak rol isteyebilirsiniz'
                    }
                }]
            };
            await roleChannel.send(roleMessage);
            console.log('  ✓ Rol seçimi mesajı gönderildi');
        }
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

    if (args.length < 2) {
        console.log('Kullanım: node deploy_template.js YOUR_BOT_TOKEN YOUR_SERVER_ID');
        console.log();
        console.log('Bot token\'ı Discord Developer Portal\'dan alabilirsiniz:');
        console.log('https://discord.com/developers/applications');
        console.log();
        console.log('Server ID\'yi Discord\'dan alabilirsiniz:');
        console.log('1. Discord\'da Ayarlar > Gelişmiş > Geliştirici Modu\'nu açın');
        console.log('2. Sunucuya sağ tıklayın > "Sunucu ID\'sini Kopyala"');
        process.exit(1);
    }

    const token = args[0];
    const guildId = args[1];
    const deployer = new TemplateDeployer(token, guildId);
    deployer.run();
}

// Script doğrudan çalıştırılıyorsa main fonksiyonunu çağır
if (require.main === module) {
    main();
}

module.exports = TemplateDeployer;
