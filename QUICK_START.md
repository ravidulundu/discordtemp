# Dulundu.dev Vibe Coding - Hızlı Başlangıç Rehberi 🚀

Bu rehber, **Dulundu.dev Vibe Coding Topluluğu** Discord sunucusunu nasıl kuracağınızı adım adım gösterir.

## 📋 Gereksinimler

- Discord hesabı
- Discord Bot Token
- Node.js (v16+) veya Python (3.8+)

## 🤖 Bot Oluşturma

1. **Discord Developer Portal'a gidin:**
   - https://discord.com/developers/applications

2. **Yeni Uygulama Oluşturun:**
   - "New Application" butonuna tıklayın
   - Uygulamanıza bir isim verin (örn: "Dulundu.dev Bot")
   - "Create" butonuna tıklayın

3. **Bot Oluşturun:**
   - Sol menüden "Bot" sekmesine gidin
   - "Add Bot" butonuna tıklayın
   - Onaylayın

4. **Bot Token'ı Kopyalayın:**
   - "Reset Token" butonuna tıklayın
   - Token'ı kopyalayın ve güvenli bir yere kaydedin
   - ⚠️ Bu token'ı asla paylaşmayın!

5. **Bot İzinlerini Ayarlayın:**
   - "Privileged Gateway Intents" bölümünde şunları etkinleştirin:
     - ✅ PRESENCE INTENT
     - ✅ SERVER MEMBERS INTENT
     - ✅ MESSAGE CONTENT INTENT

6. **OAuth2 URL Oluşturun:**
   - Sol menüden "OAuth2" > "URL Generator" sekmesine gidin
   - **SCOPES** bölümünde seçin:
     - ✅ `bot`
     - ✅ `applications.commands`
   - **BOT PERMISSIONS** bölümünde seçin:
     - ✅ Administrator (veya gerekli izinler)
   - En alttaki URL'yi kopyalayın

7. **Botu Sunucunuza Ekleyin:**
   - Kopyaladığınız URL'yi tarayıcınıza yapıştırın
   - Bir sunucu seçin (veya test için yeni sunucu oluşturun)
   - "Authorize" butonuna tıklayın

## 🚀 Kurulum ve Kullanım

### Yöntem 1: JavaScript (Node.js)

```bash
# 1. Gerekli paketleri yükleyin
npm install

# 2. Sunucu ID'nizi alın (Ayarlar > Gelişmiş > Geliştirici Modu > Sunucuya sağ tık)

# 3. Template'i deploy edin
node deploy_template.js YOUR_BOT_TOKEN YOUR_SERVER_ID
```

### Yöntem 2: Python

```bash
# 1. Sanal ortam oluşturun (opsiyonel ama önerilir)
python -m venv venv

# Windows'ta:
venv\Scripts\activate

# Linux/Mac'te:
source venv/bin/activate

# 2. Gerekli paketleri yükleyin
pip install -r requirements.txt

# 3. Sunucu ID'nizi alın (Ayarlar > Gelişmiş > Geliştirici Modu > Sunucuya sağ tık)

# 4. Template'i deploy edin
python deploy_template.py YOUR_BOT_TOKEN YOUR_SERVER_ID
```

## ✅ Sonuç

Script çalıştığında:

1. ✅ Bot giriş yapacak
2. ✅ Yeni sunucu oluşturacak
3. ✅ Rolleri ekleyecek
4. ✅ Kategorileri ve kanalları oluşturacak
5. ✅ İzinleri yapılandıracak
6. ✅ Davet linki oluşturacak

Çıktı örneği:
```
============================================================
Discord Developer Community Template Deployer
============================================================

✅ Template yüklendi: Dulundu.dev Vibe Coding Topluluğu
✅ Bot giriş yaptı: YourBot#1234
🚀 Sunucu oluşturuluyor...

✅ Sunucu oluşturuldu: Dulundu.dev Vibe Coding Topluluğu

📝 Roller oluşturuluyor...
  ✓ @everyone rolü güncellendi
  ✓ 👑 Kurucu oluşturuldu
  ✓ 🛡️ Moderatör oluşturuldu
  ✓ ⭐ Kıdemli Developer oluşturuldu
  ...

📁 Kategoriler ve kanallar oluşturuluyor...
  ✓ Kategori: 👋 HOŞGELDİN
    ✓ Metin kanalı: #📢┃hoşgeldin
    ✓ Metin kanalı: #📜┃kurallar
    ...

⚙️ Sunucu ayarları yapılandırılıyor...
  ✓ AFK kanalı ayarlandı: 😴 AFK
  ✓ Sistem kanalı ayarlandı: 💭┃genel-sohbet
  ✓ Doğrulama seviyesi ve bildirim ayarları yapılandırıldı

✅ Sunucu başarıyla oluşturuldu!
📋 Sunucu Adı: Dulundu.dev Vibe Coding Topluluğu
🆔 Sunucu ID: 1234567890123456789
🔗 Davet Linki: https://discord.gg/xxxxxxxxxx
```

## 🎨 Özelleştirme

`vibe-coding-template.json` dosyasını düzenleyerek:

- ✏️ Sunucu adını değiştirin
- 🎨 Rol renklerini ve ikonlarını değiştirin
- 📝 Kanal isimlerini ve açıklamalarını güncelleyin
- ➕ Yeni kanallar ve roller ekleyin
- 🔒 İzinleri özelleştirin
- 🌟 İkonları değiştirin veya yeni ekleyin

## 🆘 Sorun Giderme

### "Invalid Bot Token" hatası
- Bot token'ı doğru kopyaladığınızdan emin olun
- Token'da boşluk olmadığından emin olun

### "Missing Permissions" hatası
- Bot'un Administrator iznine sahip olduğundan emin olun
- Privileged Gateway Intents'in etkin olduğundan emin olun

### "Module not found" hatası
**Node.js:**
```bash
npm install discord.js
```

**Python:**
```bash
pip install discord.py
```

## 📚 Daha Fazla Bilgi

- Discord.js Dokümantasyonu: https://discord.js.org/
- Discord.py Dokümantasyonu: https://discordpy.readthedocs.io/
- Discord Developer Portal: https://discord.com/developers/docs

## 🤝 Destek

Sorun yaşarsanız:
1. Token'ınızın doğru olduğundan emin olun
2. Bot'un gerekli izinlere sahip olduğundan emin olun
3. İnternet bağlantınızı kontrol edin
4. Script çıktısındaki hata mesajlarını okuyun
