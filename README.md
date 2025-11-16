# Developer Community Discord Template

Bu template, yazılımcı topluluğu için hazırlanmış kapsamlı bir Discord sunucu şablonudur.

## 📋 İçerik

### Roller ve İzinler

| Rol | Renk | İzinler | Açıklama |
|-----|------|---------|----------|
| **Admin** | Kırmızı (#E74C3C) | Tam Yönetici | Sunucu yöneticileri |
| **Moderator** | Turuncu (#E67E22) | Mesaj/Üye Yönetimi | Moderatörler |
| **Senior Developer** | Mavi (#3498DB) | Standart | Kıdemli yazılımcılar |
| **Developer** | Turkuaz (#2ECC71) | Standart | Yazılımcılar |
| **Contributor** | Mor (#9B59B6) | Standart | Katkıda bulunanlar |
| **Member** | Gri (#95A5A6) | Standart | Üyeler |
| **Bot** | Açık Mavi (#586F7C) | Bot İzinleri | Botlar için |

### Kanal Yapısı

#### 📋 WELCOME & INFO
- **welcome** - Hoş geldin mesajları (salt okunur)
- **rules** - Sunucu kuralları (salt okunur)
- **announcements** - Duyurular (sadece admin/mod yazabilir)
- **resources** - Kaynaklar ve linkler

#### 💬 GENERAL
- **general-chat** - Genel sohbet
- **introductions** - Tanışma kanalı
- **off-topic** - Off-topic konuşmalar
- **memes** - Programlama memleri

#### 💻 DEVELOPMENT
- **coding-help** - Kod yardımı
- **code-review** - Kod inceleme
- **project-showcase** - Proje gösterimi
- **collaboration** - İşbirliği
- **github-updates** - GitHub bildirimleri

#### 🔧 PROGRAMMING LANGUAGES
- **python** - Python
- **javascript-typescript** - JavaScript/TypeScript
- **java** - Java
- **cpp** - C/C++
- **web-development** - Web geliştirme
- **mobile-dev** - Mobil geliştirme
- **databases** - Veritabanları
- **devops-cloud** - DevOps ve Cloud

#### 📚 RESOURCES & CAREER
- **tutorials-guides** - Eğitimler ve rehberler
- **tools-and-libraries** - Araçlar ve kütüphaneler
- **job-opportunities** - İş ilanları
- **interview-prep** - Mülakat hazırlığı
- **freelance-discussion** - Freelance tartışmaları

#### 🎙️ VOICE CHANNELS
- **General Voice** - Genel ses
- **Coding Sessions** - Kodlama seansları
- **Study Room** - Çalışma odası
- **Team Meeting** - Takım toplantısı
- **AFK** - AFK kanalı

#### 🤖 BOT & ADMIN
- **bot-commands** - Bot komutları
- **admin-chat** - Admin sohbeti (sadece admin/mod)
- **mod-logs** - Moderasyon logları (sadece admin/mod)

## 🚀 Kullanım

### Discord.js ile Yükleme

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  const template = JSON.parse(fs.readFileSync('developer-community-template.json', 'utf8'));

  try {
    const guild = await client.guilds.create(template.name, {
      template: template
    });
    console.log(`Server created: ${guild.name}`);
  } catch (error) {
    console.error('Error creating server:', error);
  }
});

client.login('YOUR_BOT_TOKEN');
```

### Discord.py ile Yükleme

```python
import discord
import json

client = discord.Client(intents=discord.Intents.default())

@client.event
async def on_ready():
    with open('developer-community-template.json', 'r', encoding='utf-8') as f:
        template = json.load(f)

    try:
        guild = await client.create_guild(name=template['name'])
        print(f'Server created: {guild.name}')

        # Rol ve kanal oluşturma işlemleri...

    except Exception as e:
        print(f'Error: {e}')

client.run('YOUR_BOT_TOKEN')
```

## 🔧 İzin Detayları

### İzin Bitleri
- `8` - Administrator (Tam Yetki)
- `1099511627862` - Moderator (Mesaj Yönetimi, Üye Yönetimi, vb.)
- `1071698660929` - Standart Üye İzinleri
- `412384658496` - Bot İzinleri
- `2048` - Send Messages
- `66560` - View Channel + Read Message History
- `1024` - View Channel

### Kanal Özel İzinleri

**Welcome, Rules, Announcements:**
- @everyone: Mesaj gönderemez, sadece okuyabilir
- Admin/Mod: Mesaj gönderebilir

**BOT & ADMIN Kategorisi:**
- @everyone: Kanalları göremez
- Admin/Mod: Tam erişim

## 📝 Özelleştirme

Template'i ihtiyaçlarınıza göre özelleştirebilirsiniz:

1. **Rol renkleri:** `color` değerini değiştirin (decimal renk kodu)
2. **Kanal konuları:** `topic` alanını düzenleyin
3. **İzinler:** `permissions` ve `permission_overwrites` değerlerini ayarlayın
4. **Yeni kanallar:** Yeni channel objeleri ekleyin

## 🎨 Renk Kodları (Decimal)

- Kırmızı: 15158332 (#E74C3C)
- Turuncu: 15105570 (#E67E22)
- Mavi: 3447003 (#3498DB)
- Yeşil: 3066993 (#2ECC71)
- Mor: 10181046 (#9B59B6)
- Gri: 9807270 (#95A5A6)

## 📄 Lisans

Bu template açık kaynaklıdır ve serbestçe kullanılabilir.

## 🤝 Katkıda Bulunma

İyileştirme önerileri ve katkılarınızı bekliyoruz!
