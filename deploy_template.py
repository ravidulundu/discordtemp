"""
Discord Developer Community Template Deployer
Bu script, template'i Discord sunucusuna yükler.

Gereksinimler:
    pip install discord.py

Kullanım:
    python deploy_template.py YOUR_BOT_TOKEN
"""

import discord
from discord.ext import commands
import json
import sys
import asyncio


class TemplateDeployer:
    def __init__(self, token, guild_id, template_file='vibe-coding-template.json'):
        self.token = token
        self.guild_id = guild_id
        self.template_file = template_file
        self.template = None
        self.guild = None
        self.role_map = {}
        self.channel_map = {}

        # Bot intents
        intents = discord.Intents.default()
        intents.guilds = True
        intents.members = True

        self.bot = commands.Bot(command_prefix='!', intents=intents)
        self.setup_events()

    def load_template(self):
        """Template dosyasını yükle"""
        try:
            with open(self.template_file, 'r', encoding='utf-8') as f:
                self.template = json.load(f)
            print(f"✅ Template yüklendi: {self.template['name']}")
            return True
        except FileNotFoundError:
            print(f"❌ Template dosyası bulunamadı: {self.template_file}")
            return False
        except json.JSONDecodeError:
            print(f"❌ Template dosyası geçersiz JSON formatında")
            return False

    def setup_events(self):
        @self.bot.event
        async def on_ready():
            print(f'✅ Bot giriş yaptı: {self.bot.user.name}')
            print('🚀 Sunucu oluşturuluyor...\n')

            await self.create_server()

            print('\n✅ Sunucu başarıyla oluşturuldu!')
            print(f'📋 Sunucu Adı: {self.guild.name}')
            print(f'🆔 Sunucu ID: {self.guild.id}')
            print(f'🔗 Davet Linki Oluşturuluyor...')

            # İlk metin kanalına davet linki oluştur
            first_text_channel = next(
                (ch for ch in self.guild.channels if isinstance(ch, discord.TextChannel)),
                None
            )
            if first_text_channel:
                invite = await first_text_channel.create_invite(max_age=0, max_uses=0)
                print(f'🔗 Davet Linki: {invite.url}')

            await self.bot.close()

    async def create_server(self):
        """Sunucuyu yapılandır"""
        # Mevcut sunucuyu al
        try:
            self.guild = await self.bot.fetch_guild(int(self.guild_id))
            print(f"✅ Sunucu bulundu: {self.guild.name}")
        except discord.NotFound:
            print(f"❌ Hata: Sunucu bulunamadı (ID: {self.guild_id})")
            print("   Sunucu ID'sini kontrol edin ve botun sunucuda olduğundan emin olun.")
            await self.bot.close()
            return
        except discord.Forbidden:
            print(f"❌ Hata: Bot sunucuya erişim izni yok (ID: {self.guild_id})")
            await self.bot.close()
            return
        except ValueError:
            print(f"❌ Hata: Geçersiz sunucu ID formatı: {self.guild_id}")
            print("   Sunucu ID sayısal bir değer olmalıdır.")
            await self.bot.close()
            return

        # Kanalları temizle
        await self.delete_all_channels()

        # Rolleri oluştur
        await self.create_roles()

        # Kategorileri ve kanalları oluştur
        await self.create_channels()

        # Sunucu ayarlarını yapılandır
        await self.configure_server()

    async def delete_all_channels(self):
        """Tüm kanalları temizle"""
        print("\n📋 Mevcut kanallar temizleniyor...\n")

        # Community Server özelliklerini devre dışı bırak
        try:
            await self.guild.edit(community=False)
            print("✅ Community Server özellikleri devre dışı bırakıldı")
            await asyncio.sleep(2)
        except (discord.Forbidden, discord.HTTPException) as e:
            print(f"ℹ️ Community özelliği zaten kapalı veya kapatılamadı: {e}")

        max_attempts = 3
        for attempt in range(max_attempts):
            # Kanalları yeniden getir
            channels = await self.guild.fetch_channels()

            if not channels:
                print("✅ Tüm kanallar temizlendi!\n")
                return

            print(f"🔄 {len(channels)} kanal siliniyor... (Deneme {attempt + 1}/{max_attempts})")

            # Kanalları sil
            for channel in channels:
                try:
                    await channel.delete()
                    print(f"  🗑️ {channel.name} silindi")
                except discord.Forbidden:
                    print(f"  ⚠️ {channel.name} silinemedi: İzin yok")
                except discord.HTTPException as e:
                    print(f"  ⚠️ {channel.name} silinemedi: {e}")
                except Exception as e:
                    print(f"  ⚠️ {channel.name} silinemedi: Beklenmeyen hata - {type(e).__name__}: {e}")

            print("⏳ Silme işleminin tamamlanması bekleniyor...")
            await asyncio.sleep(3)

        # Son kontrol
        remaining = await self.guild.fetch_channels()
        if remaining:
            print(f"⚠️ Uyarı: {len(remaining)} kanal hala mevcut. Devam ediliyor...")

    async def create_roles(self):
        """Rolleri oluştur"""
        print("\n📝 Roller oluşturuluyor...")

        for role_data in self.template['roles']:
            if role_data['name'] == '@everyone':
                # @everyone rolünü güncelle
                everyone_role = self.guild.default_role
                self.role_map[role_data['id']] = everyone_role
                await everyone_role.edit(permissions=discord.Permissions(int(role_data['permissions'])))
                print(f"  ✓ @everyone rolü güncellendi")
            else:
                # Yeni rol oluştur
                role = await self.guild.create_role(
                    name=role_data['name'],
                    permissions=discord.Permissions(int(role_data['permissions'])),
                    colour=discord.Colour(role_data['color']),
                    hoist=role_data['hoist'],
                    mentionable=role_data['mentionable']
                )
                self.role_map[role_data['id']] = role
                print(f"  ✓ {role.name} oluşturuldu")

    async def create_channels(self):
        """Kategorileri ve kanalları oluştur"""
        print("\n📁 Kategoriler ve kanallar oluşturuluyor...")

        # Önce kategorileri oluştur
        categories = [ch for ch in self.template['channels'] if ch['type'] == 4]
        for category_data in categories:
            overwrites = self.get_permission_overwrites(category_data.get('permission_overwrites', []))

            category = await self.guild.create_category(
                name=category_data['name'],
                overwrites=overwrites,
                position=category_data['position']
            )
            self.channel_map[category_data['id']] = category
            print(f"  ✓ Kategori: {category.name}")

        # Sonra kanalları oluştur
        text_channels = [ch for ch in self.template['channels'] if ch['type'] == 0]
        voice_channels = [ch for ch in self.template['channels'] if ch['type'] == 2]

        for channel_data in sorted(text_channels + voice_channels, key=lambda x: x['position']):
            await self.create_channel(channel_data)

    async def create_channel(self, channel_data):
        """Tek bir kanal oluştur"""
        category = None
        if 'parent_id' in channel_data:
            category = self.channel_map.get(channel_data['parent_id'])

        overwrites = self.get_permission_overwrites(channel_data.get('permission_overwrites', []))

        if channel_data['type'] == 0:  # Text channel
            channel = await self.guild.create_text_channel(
                name=channel_data['name'],
                category=category,
                overwrites=overwrites,
                topic=channel_data.get('topic', ''),
                position=channel_data['position']
            )
            print(f"    ✓ Metin kanalı: #{channel.name}")
        elif channel_data['type'] == 2:  # Voice channel
            channel = await self.guild.create_voice_channel(
                name=channel_data['name'],
                category=category,
                overwrites=overwrites,
                position=channel_data['position']
            )
            print(f"    ✓ Ses kanalı: 🔊 {channel.name}")

        self.channel_map[channel_data['id']] = channel

    def get_permission_overwrites(self, overwrites_data):
        """İzin üzerine yazma işlemlerini hazırla"""
        overwrites = {}

        for overwrite in overwrites_data:
            target_id = overwrite['id']

            # Rolü bul
            if target_id in self.role_map:
                target = self.role_map[target_id]

                allow = discord.Permissions(int(overwrite.get('allow', 0)))
                deny = discord.Permissions(int(overwrite.get('deny', 0)))

                overwrites[target] = discord.PermissionOverwrite.from_pair(allow, deny)

        return overwrites

    async def configure_server(self):
        """Sunucu ayarlarını yapılandır"""
        print("\n⚙️ Sunucu ayarları yapılandırılıyor...")

        # AFK kanalını ayarla
        if 'afk_channel_id' in self.template:
            afk_channel = self.channel_map.get(self.template['afk_channel_id'])
            if afk_channel:
                await self.guild.edit(afk_channel=afk_channel, afk_timeout=300)
                print(f"  ✓ AFK kanalı ayarlandı: {afk_channel.name}")

        # Sistem kanalını ayarla
        if 'system_channel_id' in self.template:
            system_channel = self.channel_map.get(self.template['system_channel_id'])
            if system_channel:
                await self.guild.edit(system_channel=system_channel)
                print(f"  ✓ Sistem kanalı ayarlandı: {system_channel.name}")

        # Doğrulama seviyesini ayarla
        verification_levels = {
            0: discord.VerificationLevel.none,
            1: discord.VerificationLevel.low,
            2: discord.VerificationLevel.medium,
            3: discord.VerificationLevel.high,
            4: discord.VerificationLevel.highest
        }
        verification = verification_levels.get(self.template.get('verification_level', 0))

        await self.guild.edit(
            verification_level=verification,
            default_notifications=discord.NotificationLevel.only_mentions if self.template.get('default_message_notifications', 0) == 0 else discord.NotificationLevel.all_messages,
            explicit_content_filter=discord.ContentFilter(self.template.get('explicit_content_filter', 0))
        )
        print(f"  ✓ Doğrulama seviyesi ve bildirim ayarları yapılandırıldı")

        # Hoşgeldin, kurallar ve rol seçimi mesajlarını gönder
        await self.send_welcome_message()
        await self.send_rules_message()
        await self.send_role_selection_message()

    async def send_welcome_message(self):
        """Hoşgeldin mesajını gönder"""
        print("\n📨 Hoşgeldin mesajı gönderiliyor...")

        # Hoşgeldin kanalını bul
        welcome_channel = None
        for channel in self.guild.text_channels:
            if channel.name == '📢┃hoşgeldin':
                welcome_channel = channel
                break

        if welcome_channel:
            embed = discord.Embed(
                color=0x5865F2,
                title='👋 HOŞ GELDİN!',
                description=(
                    '**Dulundu.dev Vibe Coding Topluluğu\'na katıldın!**\n\n'
                    'Türkiye\'nin en vibe\'lı yazılım topluluğunda seni aramızda görmekten mutluyuz! 🎉\n\n'
                    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                ),
                timestamp=discord.utils.utcnow()
            )

            # Topluluk özellikleri
            embed.add_field(name='\u200b', value='**🎯 BURASI SENİN İÇİN**', inline=False)
            embed.add_field(name='💻 Öğren', value='Kod yazmayı\nöğren', inline=True)
            embed.add_field(name='🚀 Geliştir', value='Projeler\noluştur', inline=True)
            embed.add_field(name='🤝 Paylaş', value='Deneyim\npaylaş', inline=True)
            embed.add_field(name='👥 Tanış', value='Arkadaş\nedin', inline=True)
            embed.add_field(name='💼 Keşfet', value='Kariyer\nfırsatları', inline=True)
            embed.add_field(name='🎮 Eğlen', value='Kod yazarken\neğlen', inline=True)

            # Kanal linklerini bul
            rules_channel = next((ch for ch in self.guild.text_channels if ch.name == '📜┃kurallar'), None)
            role_channel = next((ch for ch in self.guild.text_channels if ch.name == '🎯┃rol-seçimi'), None)
            intro_channel = next((ch for ch in self.guild.text_channels if ch.name == '👋┃tanışma'), None)
            chat_channel = next((ch for ch in self.guild.text_channels if ch.name == '💭┃genel-sohbet'), None)
            help_channel = next((ch for ch in self.guild.text_channels if ch.name == '🆘┃yardım'), None)
            links_channel = next((ch for ch in self.guild.text_channels if ch.name == '🔗┃faydalı-linkler'), None)

            # İlk adımlar
            first_steps = '**🚀 İLK ADIMLAR**\n\n'
            if rules_channel:
                first_steps += f'1️⃣ <#{rules_channel.id}> **Kuralları oku**\n'
            if role_channel:
                first_steps += f'2️⃣ <#{role_channel.id}> **Rollerini seç**\n'
            if intro_channel:
                first_steps += f'3️⃣ <#{intro_channel.id}> **Kendini tanıt**\n'
            if chat_channel:
                first_steps += f'4️⃣ <#{chat_channel.id}> **Sohbete katıl**\n\n'
            first_steps += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

            embed.add_field(name='\u200b', value=first_steps, inline=False)

            # İpuçları
            if help_channel:
                embed.add_field(name='💡 İpucu', value=f'Yardıma mı ihtiyacın var? → <#{help_channel.id}>', inline=True)
            if links_channel:
                embed.add_field(name='📚 Kaynaklar', value=f'Faydalı linkler → <#{links_channel.id}>', inline=True)

            embed.set_footer(text='Dulundu.dev Vibe Coding • Kod yazarken eğlenin!')

            await welcome_channel.send(embed=embed)
            print('  ✓ Geliştirilmiş hoşgeldin mesajı gönderildi')

    async def send_rules_message(self):
        """Kurallar mesajını gönder"""
        print("\n📨 Kurallar mesajı gönderiliyor...")

        # Kurallar kanalını bul
        rules_channel = None
        for channel in self.guild.text_channels:
            if channel.name == '📜┃kurallar':
                rules_channel = channel
                break

        if rules_channel:
            embed = discord.Embed(
                color=0xe74c3c,
                title='📜 SUNUCU KURALLARI',
                description=(
                    '**Dulundu.dev Vibe Coding Topluluğu\'na hoş geldin!**\n\n'
                    'Güvenli ve keyifli bir ortam için aşağıdaki kuralları lütfen oku ve uygula.\n\n'
                    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                ),
                timestamp=discord.utils.utcnow()
            )

            # Temel kurallar
            embed.add_field(name='\u200b', value='**🤝 TOPLULUK KURALLARI**', inline=False)
            embed.add_field(name='1️⃣ Saygılı Ol', value='Herkese nazik\nve saygılı davran', inline=True)
            embed.add_field(name='2️⃣ Spam Yasak', value='Gereksiz tekrar\nmesaj atma', inline=True)
            embed.add_field(name='3️⃣ Doğru Kanal', value='Konuya uygun\nkanal kullan', inline=True)
            embed.add_field(name='4️⃣ Reklam Yasak', value='İzinsiz sunucu\nreklamı yapma', inline=True)
            embed.add_field(name='5️⃣ Uygun İçerik', value='NSFW ve şiddet\niçerik yasak', inline=True)
            embed.add_field(name='6️⃣ Hesap Güvenliği', value='Fake hesap\nkullanma', inline=True)

            # Kritik kurallar
            embed.add_field(
                name='\u200b',
                value='━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**⚠️ KESİN YASAK - DERHAL BAN!**',
                inline=False
            )
            embed.add_field(
                name='❌ Ayrımcılık ve Nefret Söylemi',
                value=(
                    '**Hiçbir şekilde tolerans gösterilmez:**\n'
                    '• Irkçılık, cinsiyet ayrımcılığı\n'
                    '• Homofobia, transfobia\n'
                    '• Etnik köken, din, cinsel yönelim nedeniyle ayrımcılık\n'
                    '• Nefret söylemi ve grup hakaret\n\n'
                    '**→ İhlal = Anında Kalıcı Ban**'
                ),
                inline=False
            )
            embed.add_field(
                name='❌ Politika ve Din Tartışmaları',
                value=(
                    '**Bu konular topluluk barışını bozar:**\n'
                    '• Politik tartışma ve propaganda\n'
                    '• Siyasi parti/lider propagandası\n'
                    '• Dini tartışma ve misyonerlik\n\n'
                    '**→ Gündem değil, kod konuşalım!**'
                ),
                inline=False
            )

            # Kanal linklerini bul
            bot_channel = next((ch for ch in self.guild.text_channels if ch.name == '🤖┃bot-komutları'), None)
            python_channel = next((ch for ch in self.guild.text_channels if ch.name == '🐍┃python'), None)
            js_channel = next((ch for ch in self.guild.text_channels if ch.name == '💛┃javascript'), None)
            project_channel = next((ch for ch in self.guild.text_channels if ch.name == '🎨┃proje-vitrini'), None)
            links_channel = next((ch for ch in self.guild.text_channels if ch.name == '🔗┃faydalı-linkler'), None)
            jobs_channel = next((ch for ch in self.guild.text_channels if ch.name == '💼┃iş-ilanları'), None)
            security_channel = next((ch for ch in self.guild.text_channels if ch.name == '🔒┃güvenlik-bildirimi'), None)

            # Detaylı kurallar
            embed.add_field(
                name='\u200b',
                value='━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**📋 DETAYLI KURALLAR**',
                inline=False
            )
            embed.add_field(
                name='💬 Saygılı İletişim',
                value='✓ Hakaret, küfür, taciz yasak\n✓ Yapıcı eleştiri yap\n✓ Farklı görüşlere saygı',
                inline=True
            )

            spam_rules = '✓ CAPS LOCK kullanma\n✓ Emoji/sticker spam yapma'
            if bot_channel:
                spam_rules += f'\n✓ Bot komutları → <#{bot_channel.id}>'
            embed.add_field(name='🚫 Spam Kuralları', value=spam_rules, inline=True)

            channel_usage = '✓ Her konu için uygun kanal'
            if python_channel:
                channel_usage += f'\n✓ Python → <#{python_channel.id}>'
            if js_channel:
                channel_usage += f'\n✓ JavaScript → <#{js_channel.id}>'
            if project_channel:
                channel_usage += f'\n✓ Projeler → <#{project_channel.id}>'
            embed.add_field(name='📁 Kanal Kullanımı', value=channel_usage, inline=True)

            link_rules = '✓ Sunucu davet linki yasak'
            if links_channel:
                link_rules += f'\n✓ Faydalı linkler → <#{links_channel.id}>'
            if jobs_channel:
                link_rules += f'\n✓ İş ilanları → <#{jobs_channel.id}>'
            embed.add_field(name='🔗 Link Paylaşımı', value=link_rules, inline=True)

            embed.add_field(
                name='🛡️ Güvenlik',
                value='✓ Kişisel bilgi paylaşma\n✓ Şüpheli linke tıklama\n✓ Korsan yazılım paylaşma',
                inline=True
            )
            embed.add_field(
                name='🌍 Dil Kullanımı',
                value='✓ Ana dil: Türkçe\n✓ İngilizce kaynak OK\n✓ Anlaşılır yazım',
                inline=True
            )

            # Cezalar
            embed.add_field(
                name='\u200b',
                value='━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**⚖️ KURAL İHLALLERİ VE CEZALAR**',
                inline=False
            )
            embed.add_field(
                name='📊 Normal İhlaller',
                value='**1. İhlal** → ⚠️ Uyarı\n**2. İhlal** → 🔇 Timeout\n**3. İhlal** → 👢 Kick\n**4. İhlal** → 🔨 Ban',
                inline=True
            )
            embed.add_field(
                name='🚨 Ciddi İhlaller (Direkt Ban)',
                value='❌ Irkçılık ve ayrımcılık\n❌ Taciz ve tehdit\n❌ NSFW içerik\n❌ Spam/raid saldırısı',
                inline=True
            )

            # Moderatör rolünü bul
            moderator_role = self.role_map.get('3')
            mod_mention = f'<@&{moderator_role.id}>' if moderator_role else '@Moderatör'
            embed.add_field(
                name='💡 Yardım',
                value=f'**Sorun mu var?**\nModeratörlere ulaş:\n{mod_mention}',
                inline=True
            )

            # Son notlar
            final_note = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ **Kuralları okudum ve kabul ediyorum**\n\n'
            if security_channel:
                final_note += f'Güvenlik açığı buldun mu? → <#{security_channel.id}>\n'
            final_note += 'Moderatörler duruma göre karar alma hakkını saklı tutar.'
            embed.add_field(name='\u200b', value=final_note, inline=False)

            embed.set_footer(text='Dulundu.dev Vibe Coding • Discord Topluluk Kuralları ile uyumludur')

            await rules_channel.send(embed=embed)
            print('  ✓ Kurallar mesajı gönderildi')

            # Discord kuralları linki
            await rules_channel.send(
                content='📖 **Discord Topluluk Kuralları:** https://discord.com/guidelines\n🔒 **Gizlilik Politikası:** https://discord.com/privacy'
            )
            print('  ✓ Discord kuralları linki eklendi')

    async def send_role_selection_message(self):
        """Rol seçimi mesajını gönder"""
        print("\n📨 Rol seçimi mesajı gönderiliyor...")

        # Rol seçimi kanalını bul
        role_channel = None
        for channel in self.guild.text_channels:
            if channel.name == '🎯┃rol-seçimi':
                role_channel = channel
                break

        if role_channel:
            embed = discord.Embed(
                title='🎯 ROL SEÇİMİ',
                description=(
                    '**Aşağıdaki emoji\'lere tıklayarak istediğiniz rolleri alabilirsiniz!**\n\n'
                    'Her emoji bir rolü temsil eder. Emoji\'ye tıkladığınızda rol otomatik olarak verilir, '
                    'emoji\'yi kaldırdığınızda rol silinir.\n\n'
                    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                ),
                color=0x9b59b6,
                timestamp=discord.utils.utcnow()
            )

            # Developer Rolleri Başlığı
            embed.add_field(name='\u200b', value='**💻 DEVELOPER ROLLERİ**', inline=False)
            embed.add_field(name='💻', value='**Developer**\nAktif yazılımcılar', inline=True)
            embed.add_field(name='⭐', value='**Kıdemli Developer**\nDeneyimli geliştiriciler', inline=True)
            embed.add_field(name='🌱', value='**Yeni Başlayan**\nYeni öğrenenler', inline=True)

            # Özel Roller Başlığı
            embed.add_field(name='\u200b', value='**🎨 ÖZEL ROLLER**', inline=False)
            embed.add_field(name='🎨', value='**Tasarımcı**\nUI/UX tasarımcılar', inline=True)
            embed.add_field(name='🚀', value='**Aktif Üye**\nAktif katılımcılar', inline=True)
            embed.add_field(name='\u200b', value='\u200b', inline=True)

            # Teknoloji Rolleri Başlığı
            embed.add_field(name='\u200b', value='**🛠️ TEKNOLOJİ ROLLERİ**', inline=False)
            embed.add_field(name='🐍', value='**Python**\nPython geliştiricileri', inline=True)
            embed.add_field(name='💛', value='**JavaScript**\nJS/TS geliştiricileri', inline=True)
            embed.add_field(name='☕', value='**Java**\nJava geliştiricileri', inline=True)
            embed.add_field(name='⚙️', value='**C/C++**\nC/C++ geliştiricileri', inline=True)
            embed.add_field(name='🌐', value='**Web Dev**\nWeb geliştiricileri', inline=True)
            embed.add_field(name='📱', value='**Mobile**\niOS/Android', inline=True)
            embed.add_field(name='🎮', value='**Game Dev**\nOyun geliştiricileri', inline=True)
            embed.add_field(name='🗄️', value='**Database**\nVeritabanı uzmanı', inline=True)
            embed.add_field(name='🔐', value='**Backend**\nBackend developer', inline=True)

            # Kullanım Talimatları
            embed.add_field(
                name='\u200b',
                value=(
                    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
                    '💡 **Nasıl Kullanılır?**\n'
                    '✅ Emoji\'ye tıkla → Rol al\n'
                    '❌ Emoji\'yi kaldır → Rol sil\n\n'
                    '🤖 Carl-bot ile çalışır. Kurulum için: `CARL_BOT_SETUP.md`'
                ),
                inline=False
            )

            embed.set_footer(text='Dulundu.dev Vibe Coding • Reaksiyon Rol Sistemi')

            await role_channel.send(embed=embed)
            print('  ✓ Geliştirilmiş rol seçimi mesajı gönderildi')

    def run(self):
        """Botu çalıştır"""
        if not self.load_template():
            return False

        try:
            self.bot.run(self.token)
            return True
        except discord.LoginFailure:
            print("❌ Geçersiz bot token!")
            return False
        except Exception as e:
            print(f"❌ Hata: {e}")
            return False


def main():
    print("=" * 60)
    print("Discord Developer Community Template Deployer")
    print("=" * 60)
    print()

    if len(sys.argv) < 3:
        print("Kullanım: python deploy_template.py YOUR_BOT_TOKEN YOUR_SERVER_ID")
        print()
        print("Bot token'ı Discord Developer Portal'dan alabilirsiniz:")
        print("https://discord.com/developers/applications")
        print()
        print("Server ID'yi Discord'dan alabilirsiniz:")
        print("1. Discord'da Ayarlar > Gelişmiş > Geliştirici Modu'nu açın")
        print("2. Sunucuya sağ tıklayın > 'Sunucu ID'sini Kopyala'")
        return

    token = sys.argv[1]
    guild_id = sys.argv[2]
    deployer = TemplateDeployer(token, guild_id)
    deployer.run()


if __name__ == '__main__':
    main()
