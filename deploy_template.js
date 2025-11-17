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

        // Kanalları tamamen temizle
        await this.deleteAllChannels();

        // Rolleri tamamen temizle
        await this.deleteAllRoles();

        // Rolleri oluştur
        await this.createRoles();

        // Kategorileri ve kanalları oluştur
        await this.createChannels();

        // Sunucu ayarlarını yapılandır
        await this.configureServer();

        // Hoşgeldin ve kurallar mesajlarını gönder
        await this.sendWelcomeMessages();
    }

    async deleteAllChannels() {
        console.log(`📋 Mevcut kanallar temizleniyor...\n`);

        // Önce Community Server özelliğini kapat (varsa)
        try {
            await this.guild.setFeatures([]);
            console.log('✅ Community Server özellikleri devre dışı bırakıldı');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('ℹ️ Community özelliği zaten kapalı veya kapatılamadı');
        }

        let attemptCount = 0;
        const maxAttempts = 3;

        while (attemptCount < maxAttempts) {
            // Cache'i yenile
            await this.guild.channels.fetch();

            const channels = Array.from(this.guild.channels.cache.values());

            if (channels.length === 0) {
                console.log('✅ Tüm kanallar temizlendi!\n');
                return;
            }

            console.log(`🔄 ${channels.length} kanal siliniyor... (Deneme ${attemptCount + 1}/${maxAttempts})`);

            // Kanalları sil
            const deletePromises = channels.map(async (channel) => {
                try {
                    await channel.delete();
                    console.log(`  🗑️ ${channel.name} silindi`);
                } catch (error) {
                    console.log(`  ⚠️ ${channel.name} silinemedi: ${error.message}`);
                }
            });

            await Promise.all(deletePromises);

            // Silme işlemlerinin tamamlanması için bekle
            console.log('⏳ Silme işleminin tamamlanması bekleniyor...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            attemptCount++;
        }

        // Son kontrol
        await this.guild.channels.fetch();
        const remainingChannels = this.guild.channels.cache.size;

        if (remainingChannels > 0) {
            console.warn(`⚠️ Uyarı: ${remainingChannels} kanal hala mevcut. Devam ediliyor...`);
        }
    }

    async deleteAllRoles() {
        console.log(`\n🎭 Mevcut roller temizleniyor...\n`);

        let attemptCount = 0;
        const maxAttempts = 3;

        while (attemptCount < maxAttempts) {
            // Cache'i yenile
            await this.guild.roles.fetch();

            // @everyone hariç tüm rolleri al
            const roles = Array.from(this.guild.roles.cache.values())
                .filter(role => {
                    // @everyone rolünü atla
                    if (role.id === this.guild.id) return false;
                    // Bot'un kendi rolünü atla (managed roles: bot rolleri, booster rolleri)
                    if (role.managed) return false;
                    return true;
                })
                // Pozisyona göre sırala (yukarıdan aşağıya sil)
                .sort((a, b) => b.position - a.position);

            if (roles.length === 0) {
                console.log('✅ Tüm roller temizlendi! (Sadece @everyone ve sistem rolleri kaldı)\n');
                return;
            }

            console.log(`🔄 ${roles.length} rol siliniyor... (Deneme ${attemptCount + 1}/${maxAttempts})`);

            // Rolleri sil
            const deletePromises = roles.map(async (role) => {
                try {
                    await role.delete();
                    console.log(`  🗑️ ${role.name} silindi`);
                } catch (error) {
                    console.log(`  ⚠️ ${role.name} silinemedi: ${error.message}`);
                }
            });

            await Promise.all(deletePromises);

            // Silme işlemlerinin tamamlanması için bekle
            console.log('⏳ Silme işleminin tamamlanması bekleniyor...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            attemptCount++;
        }

        // Son kontrol
        await this.guild.roles.fetch();
        const remainingRoles = this.guild.roles.cache.filter(r => r.id !== this.guild.id && !r.managed).size;

        if (remainingRoles > 0) {
            console.warn(`⚠️ Uyarı: ${remainingRoles} rol hala mevcut. Devam ediliyor...`);
        }
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
            const welcomeEmbed = {
                embeds: [{
                    color: 0x5865F2,
                    title: '👋 HOŞ GELDİN!',
                    description: '**Dulundu.dev Vibe Coding Topluluğu\'na katıldın!**\n\n' +
                                 'Türkiye\'nin en vibe\'lı yazılım topluluğunda seni aramızda görmekten mutluyuz! 🎉\n\n' +
                                 '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                    fields: [
                        {
                            name: '\u200b',
                            value: '**🎯 BURASI SENİN İÇİN**',
                            inline: false
                        },
                        {
                            name: '💻 Öğren',
                            value: 'Kod yazmayı\nöğren',
                            inline: true
                        },
                        {
                            name: '🚀 Geliştir',
                            value: 'Projeler\noluştur',
                            inline: true
                        },
                        {
                            name: '🤝 Paylaş',
                            value: 'Deneyim\npaylaş',
                            inline: true
                        },
                        {
                            name: '👥 Tanış',
                            value: 'Arkadaş\nedin',
                            inline: true
                        },
                        {
                            name: '💼 Keşfet',
                            value: 'Kariyer\nfırsatları',
                            inline: true
                        },
                        {
                            name: '🎮 Eğlen',
                            value: 'Kod yazarken\neğlen',
                            inline: true
                        },
                        {
                            name: '\u200b',
                            value: '**🚀 İLK ADIMLAR**\n\n' +
                                   '1️⃣ <#' + this.guild.channels.cache.find(ch => ch.name === '📜┃kurallar')?.id + '> **Kuralları oku**\n' +
                                   '2️⃣ <#' + this.guild.channels.cache.find(ch => ch.name === '🎯┃rol-seçimi')?.id + '> **Rollerini seç**\n' +
                                   '3️⃣ <#' + this.guild.channels.cache.find(ch => ch.name === '👋┃tanışma')?.id + '> **Kendini tanıt**\n' +
                                   '4️⃣ <#' + this.guild.channels.cache.find(ch => ch.name === '💭┃genel-sohbet')?.id + '> **Sohbete katıl**\n\n' +
                                   '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                            inline: false
                        },
                        {
                            name: '💡 İpucu',
                            value: 'Yardıma mı ihtiyacın var? → <#' + this.guild.channels.cache.find(ch => ch.name === '🆘┃yardım')?.id + '>',
                            inline: true
                        },
                        {
                            name: '📚 Kaynaklar',
                            value: 'Faydalı linkler → <#' + this.guild.channels.cache.find(ch => ch.name === '🔗┃faydalı-linkler')?.id + '>',
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'Dulundu.dev Vibe Coding • Kod yazarken eğlenin!',
                        icon_url: 'https://cdn.discordapp.com/emojis/1234567890.png'
                    },
                    timestamp: new Date()
                }]
            };
            await welcomeChannel.send(welcomeEmbed);
            console.log('  ✓ Geliştirilmiş hoşgeldin mesajı gönderildi');
        }

        // Kurallar kanalını bul
        const rulesChannel = this.guild.channels.cache.find(ch => ch.name === '📜┃kurallar');
        if (rulesChannel) {
            // Ana kurallar embed'i
            const rulesMessage = {
                embeds: [{
                    color: 0xe74c3c,
                    title: '📜 SUNUCU KURALLARI',
                    description: '**Dulundu.dev Vibe Coding Topluluğu\'na hoş geldin!**\n\n' +
                                 'Güvenli ve keyifli bir ortam için aşağıdaki kuralları lütfen oku ve uygula.\n\n' +
                                 '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                    fields: [
                        {
                            name: '\u200b',
                            value: '**🤝 TOPLULUK KURALLARI**',
                            inline: false
                        },
                        {
                            name: '1️⃣ Saygılı Ol',
                            value: 'Herkese nazik\nve saygılı davran',
                            inline: true
                        },
                        {
                            name: '2️⃣ Spam Yasak',
                            value: 'Gereksiz tekrar\nmesaj atma',
                            inline: true
                        },
                        {
                            name: '3️⃣ Doğru Kanal',
                            value: 'Konuya uygun\nkanal kullan',
                            inline: true
                        },
                        {
                            name: '4️⃣ Reklam Yasak',
                            value: 'İzinsiz sunucu\nreklamı yapma',
                            inline: true
                        },
                        {
                            name: '5️⃣ Uygun İçerik',
                            value: 'NSFW ve şiddet\niçerik yasak',
                            inline: true
                        },
                        {
                            name: '6️⃣ Hesap Güvenliği',
                            value: 'Fake hesap\nkullanma',
                            inline: true
                        },
                        {
                            name: '\u200b',
                            value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                                   '**⚠️ KESİN YASAK - DERHAL BAN!**',
                            inline: false
                        },
                        {
                            name: '❌ Ayrımcılık ve Nefret Söylemi',
                            value: '**Hiçbir şekilde tolerans gösterilmez:**\n' +
                                   '• Irkçılık, cinsiyet ayrımcılığı\n' +
                                   '• Homofobia, transfobia\n' +
                                   '• Etnik köken, din, cinsel yönelim nedeniyle ayrımcılık\n' +
                                   '• Nefret söylemi ve grup hakaret\n\n' +
                                   '**→ İhlal = Anında Kalıcı Ban**',
                            inline: false
                        },
                        {
                            name: '❌ Politika ve Din Tartışmaları',
                            value: '**Bu konular topluluk barışını bozar:**\n' +
                                   '• Politik tartışma ve propaganda\n' +
                                   '• Siyasi parti/lider propagandası\n' +
                                   '• Dini tartışma ve misyonerlik\n\n' +
                                   '**→ Gündem değil, kod konuşalım!**',
                            inline: false
                        },
                        {
                            name: '\u200b',
                            value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                                   '**📋 DETAYLI KURALLAR**',
                            inline: false
                        },
                        {
                            name: '💬 Saygılı İletişim',
                            value: '✓ Hakaret, küfür, taciz yasak\n' +
                                   '✓ Yapıcı eleştiri yap\n' +
                                   '✓ Farklı görüşlere saygı',
                            inline: true
                        },
                        {
                            name: '🚫 Spam Kuralları',
                            value: '✓ CAPS LOCK kullanma\n' +
                                   '✓ Emoji/sticker spam yapma\n' +
                                   '✓ Bot komutları → <#' + this.guild.channels.cache.find(ch => ch.name === '🤖┃bot-komutları')?.id + '>',
                            inline: true
                        },
                        {
                            name: '📁 Kanal Kullanımı',
                            value: '✓ Python → <#' + this.guild.channels.cache.find(ch => ch.name === '🐍┃python')?.id + '>\n' +
                                   '✓ JavaScript → <#' + this.guild.channels.cache.find(ch => ch.name === '💛┃javascript')?.id + '>\n' +
                                   '✓ Projeler → <#' + this.guild.channels.cache.find(ch => ch.name === '🎨┃proje-vitrini')?.id + '>',
                            inline: true
                        },
                        {
                            name: '🔗 Link Paylaşımı',
                            value: '✓ Sunucu davet linki yasak\n' +
                                   '✓ Faydalı linkler → <#' + this.guild.channels.cache.find(ch => ch.name === '🔗┃faydalı-linkler')?.id + '>\n' +
                                   '✓ İş ilanları → <#' + this.guild.channels.cache.find(ch => ch.name === '💼┃iş-ilanları')?.id + '>',
                            inline: true
                        },
                        {
                            name: '🛡️ Güvenlik',
                            value: '✓ Kişisel bilgi paylaşma\n' +
                                   '✓ Şüpheli linke tıklama\n' +
                                   '✓ Korsan yazılım paylaşma',
                            inline: true
                        },
                        {
                            name: '🌍 Dil Kullanımı',
                            value: '✓ Ana dil: Türkçe\n' +
                                   '✓ İngilizce kaynak OK\n' +
                                   '✓ Anlaşılır yazım',
                            inline: true
                        },
                        {
                            name: '\u200b',
                            value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                                   '**⚖️ KURAL İHLALLERİ VE CEZALAR**',
                            inline: false
                        },
                        {
                            name: '📊 Normal İhlaller',
                            value: '**1. İhlal** → ⚠️ Uyarı\n' +
                                   '**2. İhlal** → 🔇 Timeout\n' +
                                   '**3. İhlal** → 👢 Kick\n' +
                                   '**4. İhlal** → 🔨 Ban',
                            inline: true
                        },
                        {
                            name: '🚨 Ciddi İhlaller (Direkt Ban)',
                            value: '❌ Irkçılık ve ayrımcılık\n' +
                                   '❌ Taciz ve tehdit\n' +
                                   '❌ NSFW içerik\n' +
                                   '❌ Spam/raid saldırısı',
                            inline: true
                        },
                        {
                            name: '💡 Yardım',
                            value: '**Sorun mu var?**\n' +
                                   'Moderatörlere ulaş:\n' +
                                   '<@&' + this.roleMap.get('3')?.id + '>',
                            inline: true
                        },
                        {
                            name: '\u200b',
                            value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                                   '✅ **Kuralları okudum ve kabul ediyorum**\n\n' +
                                   'Güvenlik açığı buldun mu? → <#' + this.guild.channels.cache.find(ch => ch.name === '🔒┃güvenlik-bildirimi')?.id + '>\n' +
                                   'Moderatörler duruma göre karar alma hakkını saklı tutar.',
                            inline: false
                        }
                    ],
                    footer: {
                        text: 'Dulundu.dev Vibe Coding • Discord Topluluk Kuralları ile uyumludur'
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
            // Ana rol seçimi embed'i
            const roleMessage = {
                embeds: [{
                    color: 0x9b59b6,
                    title: '🎯 ROL SEÇİMİ',
                    description: '**Aşağıdaki emoji\'lere tıklayarak istediğiniz rolleri alabilirsiniz!**\n\n' +
                                 'Her emoji bir rolü temsil eder. Emoji\'ye tıkladığınızda rol otomatik olarak verilir, emoji\'yi kaldırdığınızda rol silinir.\n\n' +
                                 '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                    fields: [
                        {
                            name: '\u200b',
                            value: '**💻 DEVELOPER ROLLERİ**',
                            inline: false
                        },
                        {
                            name: '💻',
                            value: '**Developer**\nAktif yazılımcılar',
                            inline: true
                        },
                        {
                            name: '⭐',
                            value: '**Kıdemli Developer**\nDeneyimli geliştiriciler',
                            inline: true
                        },
                        {
                            name: '🌱',
                            value: '**Yeni Başlayan**\nYeni öğrenenler',
                            inline: true
                        },
                        {
                            name: '\u200b',
                            value: '**🎨 ÖZEL ROLLER**',
                            inline: false
                        },
                        {
                            name: '🎨',
                            value: '**Tasarımcı**\nUI/UX tasarımcılar',
                            inline: true
                        },
                        {
                            name: '🚀',
                            value: '**Aktif Üye**\nAktif katılımcılar',
                            inline: true
                        },
                        {
                            name: '\u200b',
                            value: '\u200b',
                            inline: true
                        },
                        {
                            name: '\u200b',
                            value: '**🛠️ TEKNOLOJİ ROLLERİ**',
                            inline: false
                        },
                        {
                            name: '🐍',
                            value: '**Python**\nPython geliştiricileri',
                            inline: true
                        },
                        {
                            name: '💛',
                            value: '**JavaScript**\nJS/TS geliştiricileri',
                            inline: true
                        },
                        {
                            name: '☕',
                            value: '**Java**\nJava geliştiricileri',
                            inline: true
                        },
                        {
                            name: '⚙️',
                            value: '**C/C++**\nC/C++ geliştiricileri',
                            inline: true
                        },
                        {
                            name: '🌐',
                            value: '**Web Dev**\nWeb geliştiricileri',
                            inline: true
                        },
                        {
                            name: '📱',
                            value: '**Mobile**\niOS/Android',
                            inline: true
                        },
                        {
                            name: '🎮',
                            value: '**Game Dev**\nOyun geliştiricileri',
                            inline: true
                        },
                        {
                            name: '🗄️',
                            value: '**Database**\nVeritabanı uzmanı',
                            inline: true
                        },
                        {
                            name: '🔐',
                            value: '**Backend**\nBackend developer',
                            inline: true
                        },
                        {
                            name: '\u200b',
                            value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                                   '💡 **Nasıl Kullanılır?**\n' +
                                   '✅ Emoji\'ye tıkla → Rol al\n' +
                                   '❌ Emoji\'yi kaldır → Rol sil\n\n' +
                                   '🤖 Carl-bot ile çalışır. Kurulum için: `CARL_BOT_SETUP.md`',
                            inline: false
                        }
                    ],
                    footer: {
                        text: 'Dulundu.dev Vibe Coding • Reaksiyon Rol Sistemi',
                        icon_url: 'https://cdn.discordapp.com/emojis/1234567890.png'
                    },
                    timestamp: new Date()
                }]
            };
            await roleChannel.send(roleMessage);
            console.log('  ✓ Geliştirilmiş rol seçimi mesajı gönderildi');
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
