/**
 * Discord Developer Community Template Deployer
 * Bu script, template'i Discord sunucusuna yükler.
 *
 * Gereksinimler:
 *     npm install discord.js dotenv
 *
 * Kullanım:
 *     1. .env dosyası ile: node deploy_template.js
 *     2. CLI parametreleri ile: node deploy_template.js YOUR_BOT_TOKEN YOUR_GUILD_ID
 */

require('dotenv').config();
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
        this.client.once('clientReady', async () => {
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

    /**
     * Bot'un gerekli izinlere sahip olduğunu doğrular
     * @throws {Error} Gerekli izin eksikse
     */
    async validatePermissions() {
        const requiredPermissions = [
            'ManageGuild',
            'ManageRoles',
            'ManageChannels',
            'ViewAuditLog'
        ];

        const botMember = this.guild.members.me;
        if (!botMember) {
            throw new Error('Bot sunucuda bulunamadı!');
        }

        const missingPermissions = requiredPermissions.filter(
            perm => !botMember.permissions.has(PermissionFlagsBits[perm])
        );

        if (missingPermissions.length > 0) {
            throw new Error(
                `❌ Bot'un gerekli izinleri yok:\n` +
                `   Eksik izinler: ${missingPermissions.join(', ')}\n` +
                `   Bot'a "Administrator" iznini ver veya şu izinleri ekle:\n` +
                `   ${missingPermissions.map(p => `   - ${p}`).join('\n')}\n`
            );
        }

        console.log('✅ Bot izinleri doğrulandı');
    }

    /**
     * Güvenli BigInt dönüşümü
     * @param {string|number} value Dönüştürülecek değer
     * @returns {bigint} BigInt değeri
     * @throws {Error} Geçersiz değer ise
     */
    safeBigInt(value) {
        try {
            return BigInt(value || 0);
        } catch (error) {
            throw new Error(`Geçersiz permission değeri: ${value}`);
        }
    }

    /**
     * Güvenli kanal mention oluştur
     * @param {string} channelName Kanal adı
     * @returns {string} Kanal mention veya fallback
     */
    getChannelMention(channelName) {
        const channel = this.guild.channels.cache.find(ch => ch.name === channelName);
        return channel ? `<#${channel.id}>` : `**#${channelName}**`;
    }

    async setupServer() {
        // Mevcut sunucuyu al
        this.guild = await this.client.guilds.fetch(this.guildId);
        console.log(`✅ Sunucu bulundu: ${this.guild.name}`);

        // Bot izinlerini kontrol et
        await this.validatePermissions();

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

        // Community Server'ın tam etkinleşmesi için bekle
        console.log('\n⏳ Community Server\'ın etkinleşmesi bekleniyor...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('  ✓ Bekleme tamamlandı\n');

        // Forum kanallarını oluştur
        await this.createForumChannels();

        // Auto Moderation yapılandır
        await this.configureAutoModeration();

        // Welcome Screen yapılandır (Community Server gerektirir)
        await this.configureWelcomeScreen();

        // Onboarding sistemini yapılandır (EN SON - Community Server tamamen hazır olmalı)
        await this.configureOnboarding();

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
            try {
                if (roleData.name === '@everyone') {
                    // @everyone rolünü güncelle
                    const everyoneRole = this.guild.roles.everyone;
                    this.roleMap.set(roleData.id, everyoneRole);
                    await everyoneRole.setPermissions(this.safeBigInt(roleData.permissions));
                    console.log('  ✓ @everyone rolü güncellendi');
                } else {
                    // Yeni rol oluştur
                    console.log(`  🔄 Oluşturuluyor: ${roleData.name}...`);
                    console.log(`     Bot user: ${this.client.user.tag}, Bot ID: ${this.client.user.id}`);
                    console.log(`     Guild: ${this.guild.name}, Guild ID: ${this.guild.id}`);
                    console.log(`     Bot guild permissions:`, this.guild.members.me.permissions.toArray().slice(0, 10).join(', '));

                    let role = null;
                    let attempts = 0;
                    const maxAttempts = 3;

                    while (!role && attempts < maxAttempts) {
                        attempts++;
                        try {
                            console.log(`     ⏳ İstek gönderiliyor... (Deneme ${attempts}/${maxAttempts})`);

                            // 60 saniye timeout ile rol oluştur (Discord API yavaş olabilir)
                            const createPromise = this.guild.roles.create({
                                name: roleData.name
                            });

                            const timeoutPromise = new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('60 saniye timeout')), 60000)
                            );

                            role = await Promise.race([createPromise, timeoutPromise]);

                            console.log(`     ✓ Rol oluşturuldu, özellikler ekleniyor...`);

                            // Sonra özellikleri ekle
                            await role.edit({
                                permissions: this.safeBigInt(roleData.permissions),
                                color: roleData.color,
                                hoist: roleData.hoist,
                                mentionable: roleData.mentionable
                            });

                            this.roleMap.set(roleData.id, role);
                            console.log(`  ✓ ${role.name} tamamlandı (ID: ${role.id})`);

                        } catch (roleError) {
                            console.error(`     ⚠️ Deneme ${attempts} başarısız: ${roleError.message}`);

                            if (roleError.message.includes('timeout')) {
                                // Race condition fix: Timeout oldu, ama rol yine de oluşmuş olabilir
                                console.log(`     🔍 Rol oluşmuş olabilir, kontrol ediliyor...`);
                                await this.guild.roles.fetch();
                                const existingRole = this.guild.roles.cache.find(r => r.name === roleData.name);

                                if (existingRole) {
                                    console.log(`     ✅ Rol timeout sonrası bulundu!`);
                                    role = existingRole;

                                    // Özellikleri ekle
                                    await role.edit({
                                        permissions: this.safeBigInt(roleData.permissions),
                                        color: roleData.color,
                                        hoist: roleData.hoist,
                                        mentionable: roleData.mentionable
                                    });

                                    this.roleMap.set(roleData.id, role);
                                    console.log(`  ✓ ${role.name} tamamlandı (ID: ${role.id})`);
                                    break; // Success, exit retry loop
                                }
                            }

                            if (attempts >= maxAttempts) {
                                console.error(`     ❌ ${maxAttempts} deneme sonunda başarısız!`);
                                throw roleError;
                            }

                            console.log(`     🔄 ${5} saniye sonra tekrar denenecek...`);
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                    }

                    // Rate limit önleme için bekle
                    console.log(`     ⏳ 3 saniye bekleniyor...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            } catch (error) {
                console.error(`  ❌ Rol oluşturulamadı (${roleData.name}):`, error.message);
                console.error(`  📋 Hata detayı:`, error.stack);
                throw error; // Hatayı fırlat ki script dursun
            }
        }
    }

    async createChannels() {
        console.log('\n📁 Kategoriler ve kanallar oluşturuluyor...');

        // Önce kategorileri oluştur
        const categories = this.template.channels.filter(ch => ch.type === 4);
        for (const categoryData of categories) {
            try {
                const overwrites = this.getPermissionOverwrites(categoryData.permission_overwrites || []);

                const category = await this.guild.channels.create({
                    name: categoryData.name,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: overwrites,
                    position: categoryData.position
                });

                this.channelMap.set(categoryData.id, category);
                console.log(`  ✓ Kategori: ${category.name}`);

                // Rate limit önleme için kısa bekle
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error(`  ❌ Kategori oluşturulamadı (${categoryData.name}):`, error.message);
                throw error;
            }
        }

        // Sonra kanalları oluştur
        const textChannels = this.template.channels.filter(ch => ch.type === 0);
        const voiceChannels = this.template.channels.filter(ch => ch.type === 2);
        const allChannels = [...textChannels, ...voiceChannels].sort((a, b) => a.position - b.position);

        for (const channelData of allChannels) {
            await this.createChannel(channelData);
            // Rate limit önleme için kısa bekle
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    async createChannel(channelData) {
        try {
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
        } catch (error) {
            console.error(`    ❌ Kanal oluşturulamadı (${channelData.name}):`, error.message);
            throw error;
        }
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
                    allow: this.safeBigInt(overwrite.allow),
                    deny: this.safeBigInt(overwrite.deny)
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

        // Community Server özelliklerini etkinleştir (Onboarding ve Welcome Screen için gerekli)
        try {
            // Kurallar kanalını ayarla (ID: 102 = kurallar)
            const rulesChannel = this.channelMap.get('102');
            // Duyurular kanalını ayarla (ID: 103 = duyurular)
            const updatesChannel = this.channelMap.get('103');

            if (rulesChannel && updatesChannel) {
                editOptions.features = ['COMMUNITY'];
                editOptions.rulesChannel = rulesChannel;
                editOptions.publicUpdatesChannel = updatesChannel;
                console.log('  ✓ Community Server özellikleri etkinleştirildi');
            }
        } catch (error) {
            console.log('  ⚠️ Community Server etkinleştirilemedi:', error.message);
        }

        // Doğrulama seviyesini ayarla
        editOptions.verificationLevel = this.template.verification_level || 0;
        editOptions.defaultMessageNotifications = this.template.default_message_notifications || 0;
        editOptions.explicitContentFilter = this.template.explicit_content_filter || 0;

        await this.guild.edit(editOptions);
        console.log('  ✓ Doğrulama seviyesi ve bildirim ayarları yapılandırıldı');
    }

    async configureOnboarding() {
        console.log('\n🎯 Onboarding sistemi yapılandırılıyor...');

        if (!this.template.onboarding || !this.template.onboarding.enabled) {
            console.log('  ℹ️ Onboarding sistemi template\'de tanımlı değil, atlanıyor...');
            return;
        }

        try {
            console.log(`  ℹ️ roleMap içeriği: ${this.roleMap.size} rol`);
            console.log(`  ℹ️ roleMap keys:`, Array.from(this.roleMap.keys()).slice(0, 5));

            // Prompt'ları hazırla (ID'ler Discord tarafından otomatik atanacak)
            const prompts = this.template.onboarding.prompts.map((promptData, pIndex) => {
                console.log(`  📝 Prompt ${pIndex + 1}: "${promptData.title}"`);

                return {
                    // ID'yi gönderme, Discord otomatik atar
                    title: promptData.title,
                    singleSelect: promptData.singleSelect || false,
                    required: promptData.required || false,
                    inOnboarding: promptData.inOnboarding !== false,
                    type: promptData.type || 0,
                    options: promptData.options.map((optionData, oIndex) => {
                        console.log(`    🔍 Option ${oIndex + 1}: "${optionData.title}", roleIds template:`, optionData.roleIds);

                        // Role ID'lerini gerçek role ID'lere çevir
                        const roleIds = optionData.roleIds.map(templateRoleId => {
                            const role = this.roleMap.get(templateRoleId);
                            if (!role) {
                                console.warn(`      ⚠️ Rol bulunamadı: ${templateRoleId}`);
                            } else {
                                console.log(`      ✓ Rol bulundu: ${templateRoleId} → ${role.name} (${role.id})`);
                            }
                            return role ? role.id : null;
                        }).filter(id => id !== null);

                        console.log(`      📋 roleIds array:`, roleIds);

                        if (roleIds.length === 0) {
                            console.warn(`      ⚠️ "${optionData.title}" için hiç rol eşleşmedi!`);
                        }

                        // Sadece dolu olan field'ları ekle
                        const option = {
                            title: optionData.title,
                            description: optionData.description || '',
                            emoji: optionData.emoji ? { name: optionData.emoji.name } : null
                        };

                        // Roller varsa ekle - Discord.js 'roles' field adı kullanır (internal olarak role_ids'e çevirir)
                        if (roleIds.length > 0) {
                            option.roles = roleIds;  // Discord.js uses 'roles' (camelCase)
                        }

                        return option;
                    })
                };
            });

            // Default channel ID'lerini gerçek channel ID'lere çevir
            const defaultChannelIds = (this.template.onboarding.defaultChannelIds || [])
                .map(templateChannelId => {
                    const channel = this.channelMap.get(templateChannelId);
                    return channel ? channel.id : null;
                })
                .filter(id => id !== null);

            // Onboarding'i yapılandır
            await this.guild.editOnboarding({
                prompts: prompts,
                defaultChannels: defaultChannelIds,
                enabled: true,
                mode: this.template.onboarding.mode || 0
            });

            console.log('  ✅ Onboarding sistemi başarıyla yapılandırıldı!');
            console.log(`  ✓ ${prompts.length} soru eklendi`);
            console.log(`  ✓ ${defaultChannelIds.length} varsayılan kanal ayarlandı`);
        } catch (error) {
            console.error('  ❌ Onboarding yapılandırılırken hata:', error.message);
            console.log('  ℹ️ Onboarding manuel olarak Discord ayarlarından yapılandırılabilir');
        }
    }

    async configureWelcomeScreen() {
        console.log('\n👋 Welcome Screen yapılandırılıyor...');

        if (!this.template.welcomeScreen || !this.template.welcomeScreen.enabled) {
            console.log('  ℹ️ Welcome Screen template\'de tanımlı değil, atlanıyor...');
            return;
        }

        try {
            // Welcome channel ID'lerini gerçek channel ID'lere çevir
            const welcomeChannels = this.template.welcomeScreen.welcomeChannels.map(wc => {
                const channel = this.channelMap.get(wc.channelId);
                if (!channel) {
                    console.warn(`    ⚠️ Kanal bulunamadı: ${wc.channelId}`);
                    return null;
                }

                return {
                    channel: channel.id,  // Discord API expects 'channel', not 'channelId'
                    description: wc.description,
                    emoji: wc.emoji.name || wc.emoji  // Just the emoji string
                };
            }).filter(wc => wc !== null);

            console.log(`  ℹ️ ${welcomeChannels.length} welcome channel hazırlandı`);

            await this.guild.editWelcomeScreen({
                enabled: true,
                description: this.template.welcomeScreen.description,
                welcomeChannels: welcomeChannels
            });

            console.log('  ✅ Welcome Screen başarıyla yapılandırıldı!');
            console.log(`  ✓ ${welcomeChannels.length} kanal eklendi`);
        } catch (error) {
            console.error('  ❌ Welcome Screen yapılandırılırken hata:', error.message);
            console.log('  ℹ️ Welcome Screen manuel olarak Discord ayarlarından yapılandırılabilir');
        }
    }

    async createForumChannels() {
        console.log('\n💬 Forum kanalları oluşturuluyor...');

        if (!this.template.forumChannels || !this.template.forumChannels.enabled) {
            console.log('  ℹ️ Forum kanalları template\'de tanımlı değil, atlanıyor...');
            return;
        }

        for (const forumData of this.template.forumChannels.channels) {
            try {
                // Parent kategorisini bul
                const parent = this.channelMap.get(forumData.parent_id);

                // Forum kanalını oluştur
                const forum = await this.guild.channels.create({
                    name: forumData.name,
                    type: ChannelType.GuildForum,
                    parent: parent,
                    topic: forumData.topic,
                    position: forumData.position,
                    availableTags: forumData.availableTags || [],
                    defaultAutoArchiveDuration: forumData.defaultAutoArchiveDuration || 1440,
                    defaultReactionEmoji: forumData.defaultReactionEmoji || null
                });

                this.channelMap.set(forumData.id, forum);
                console.log(`  ✓ Forum kanalı: ${forum.name} (${forumData.availableTags.length} tag)`);
            } catch (error) {
                console.error(`  ❌ Forum kanalı oluşturulamadı (${forumData.name}):`, error.message);
            }
        }
    }

    async configureAutoModeration() {
        console.log('\n🛡️ Auto Moderation yapılandırılıyor...');

        // Mevcut kuralları listele ve duplicate kontrolü
        let existingRules;
        try {
            existingRules = await this.guild.autoModerationRules.fetch();
            console.log(`  ℹ️ Sunucuda ${existingRules.size} mevcut Auto Mod kuralı var:`);

            // Kural isimlerini say (duplicate tespit)
            const ruleNames = {};
            existingRules.forEach(rule => {
                ruleNames[rule.name] = (ruleNames[rule.name] || 0) + 1;
                console.log(`    - ${rule.name} (Trigger Type: ${rule.triggerType})`);
            });

            // Duplicate varsa uyar
            const duplicates = Object.entries(ruleNames).filter(([name, count]) => count > 1);
            if (duplicates.length > 0) {
                console.log(`  ⚠️ Duplicate kurallar tespit edildi:`);
                duplicates.forEach(([name, count]) => {
                    console.log(`    - "${name}" ${count} kere var`);
                });
            }
        } catch (error) {
            console.log('  ⚠️ Mevcut kurallar listelenemedi:', error.message);
            existingRules = null;
        }

        if (!this.template.autoModeration || !this.template.autoModeration.enabled) {
            console.log('  ℹ️ Auto Moderation template\'de tanımlı değil, atlanıyor...');
            return;
        }

        for (const ruleData of this.template.autoModeration.rules) {
            try {
                // Aynı isimde kural var mı kontrol et
                if (existingRules) {
                    const duplicateRules = existingRules.filter(r => r.name === ruleData.name);
                    if (duplicateRules.size > 0) {
                        console.log(`  ⚠️ "${ruleData.name}" kuralı zaten var (${duplicateRules.size} adet), siliniyor...`);
                        for (const rule of duplicateRules.values()) {
                            await rule.delete();
                            console.log(`    ✓ Silindi: ${rule.name}`);
                        }
                    }
                }

                // Exempt role ID'lerini gerçek role ID'lere çevir
                const exemptRoles = (ruleData.exemptRoles || [])
                    .map(templateRoleId => {
                        const role = this.roleMap.get(templateRoleId);
                        return role ? role.id : null;
                    })
                    .filter(id => id !== null);

                // Exempt channel ID'lerini gerçek channel ID'lere çevir
                const exemptChannels = (ruleData.exemptChannels || [])
                    .map(templateChannelId => {
                        const channel = this.channelMap.get(templateChannelId);
                        return channel ? channel.id : null;
                    })
                    .filter(id => id !== null);

                // Action'lardaki channel ID'lerini çevir
                const actions = ruleData.actions.map(action => {
                    if (action.metadata && action.metadata.channel) {
                        const channel = this.channelMap.get(action.metadata.channel);
                        return {
                            ...action,
                            metadata: {
                                ...action.metadata,
                                channelId: channel ? channel.id : undefined
                            }
                        };
                    }
                    return action;
                });

                await this.guild.autoModerationRules.create({
                    name: ruleData.name,
                    eventType: ruleData.eventType,
                    triggerType: ruleData.triggerType,
                    triggerMetadata: ruleData.triggerMetadata || {},
                    actions: actions,
                    enabled: ruleData.enabled !== false,
                    exemptRoles: exemptRoles,
                    exemptChannels: exemptChannels
                });

                console.log(`  ✓ Auto Mod kuralı: ${ruleData.name}`);
            } catch (error) {
                console.error(`  ❌ Auto Mod kuralı oluşturulamadı (${ruleData.name}):`, error.message);
            }
        }
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
                                   '1️⃣ ' + this.getChannelMention('📜┃kurallar') + ' **Kuralları oku**\n' +
                                   '2️⃣ ' + this.getChannelMention('🎯┃rol-seçimi') + ' **Rollerini seç**\n' +
                                   '3️⃣ ' + this.getChannelMention('👋┃tanışma') + ' **Kendini tanıt**\n' +
                                   '4️⃣ ' + this.getChannelMention('💭┃genel-sohbet') + ' **Sohbete katıl**\n\n' +
                                   '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                            inline: false
                        },
                        {
                            name: '💡 İpucu',
                            value: 'Yardıma mı ihtiyacın var? → ' + this.getChannelMention('🆘┃yardım'),
                            inline: true
                        },
                        {
                            name: '📚 Kaynaklar',
                            value: 'Faydalı linkler → ' + this.getChannelMention('🔗┃faydalı-linkler'),
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
                                   '✓ Bot komutları → ' + this.getChannelMention('🤖┃bot-komutları'),
                            inline: true
                        },
                        {
                            name: '📁 Kanal Kullanımı',
                            value: '✓ Python → ' + this.getChannelMention('🐍┃python') + '\n' +
                                   '✓ JavaScript → ' + this.getChannelMention('💛┃javascript') + '\n' +
                                   '✓ Projeler → ' + this.getChannelMention('🎨┃proje-vitrini'),
                            inline: true
                        },
                        {
                            name: '🔗 Link Paylaşımı',
                            value: '✓ Sunucu davet linki yasak\n' +
                                   '✓ Faydalı linkler → ' + this.getChannelMention('🔗┃faydalı-linkler') + '\n' +
                                   '✓ İş ilanları → ' + this.getChannelMention('💼┃iş-ilanları'),
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
                                   'Güvenlik açığı buldun mu? → ' + this.getChannelMention('🔒┃güvenlik-bildirimi') + '\n' +
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
                                   '💡 **Nasıl Kullanılır?**\n\n' +
                                   '✅ Sunucuya **katıldığında** Discord\'un onboarding ekranı açılır\n' +
                                   '✅ Sorulara cevap vererek **rollerini seç**\n' +
                                   '✅ İstersen **Kanallar ve Roller** → **Özelleştirme** bölümünden değiştirebilirsin\n\n' +
                                   '🎯 Discord\'un yerleşik Onboarding sistemi ile otomatik rol ataması!',
                            inline: false
                        }
                    ],
                    footer: {
                        text: 'Dulundu.dev Vibe Coding • Onboarding Sistemi'
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

    // .env dosyasından veya CLI'dan token ve guild ID al
    const token = process.env.DISCORD_BOT_TOKEN || args[0];
    const guildId = process.env.DISCORD_GUILD_ID || args[1];
    const templateFile = process.env.TEMPLATE_FILE || args[2] || 'vibe-coding-template.json';

    if (!token || !guildId) {
        console.log('❌ Bot token ve Server ID gerekli!\n');
        console.log('Kullanım Seçenekleri:\n');
        console.log('1️⃣ .env dosyası ile (GÜVENLİ - ÖNERİLEN):');
        console.log('   - .env.example dosyasını .env olarak kopyala');
        console.log('   - DISCORD_BOT_TOKEN ve DISCORD_GUILD_ID değerlerini doldur');
        console.log('   - node deploy_template.js\n');
        console.log('2️⃣ CLI parametreleri ile:');
        console.log('   - node deploy_template.js YOUR_BOT_TOKEN YOUR_SERVER_ID\n');
        console.log('📖 Bot token\'ı buradan al:');
        console.log('   https://discord.com/developers/applications\n');
        console.log('📖 Server ID\'yi almak için:');
        console.log('   1. Discord\'da Ayarlar > Gelişmiş > Geliştirici Modu\'nu aç');
        console.log('   2. Sunucuya sağ tıkla > "Sunucu ID\'sini Kopyala"\n');
        process.exit(1);
    }

    if (process.env.DISCORD_BOT_TOKEN) {
        console.log('✅ .env dosyasından yapılandırma yüklendi');
    } else {
        console.log('⚠️ Token CLI parametresi ile verildi (güvenlik riski!)');
        console.log('💡 .env dosyası kullanmanız önerilir\n');
    }

    const deployer = new TemplateDeployer(token, guildId, templateFile);
    deployer.run();
}

// Script doğrudan çalıştırılıyorsa main fonksiyonunu çağır
if (require.main === module) {
    main();
}

module.exports = TemplateDeployer;
