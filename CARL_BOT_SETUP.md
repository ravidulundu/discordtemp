# 🎯 Carl-bot Reaksiyon Rol Sistemi - Kurulum Rehberi

Bu rehber, **Dulundu.dev Vibe Coding** sunucunuz için Carl-bot ile reaksiyon rol sistemini kuracak.

---

## 📋 İçindekiler

1. [Carl-bot'u Sunucuya Ekleme](#1-carl-botu-sunucuya-ekleme)
2. [Rol Seçimi Mesajı Oluşturma](#2-rol-seçimi-mesajı-oluşturma)
3. [Rolleri Ekleyerek Reaksiyon Kurulumu](#3-rolleri-ekleyerek-reaksiyon-kurulumu)
4. [Test ve Doğrulama](#4-test-ve-doğrulama)
5. [Sorun Giderme](#5-sorun-giderme)

---

## 1. Carl-bot'u Sunucuya Ekleme

### Adım 1.1: Carl-bot Davet Linki
1. **Carl.gg** web sitesine git: https://carl.gg
2. Sağ üstteki **"Invite"** veya **"Add to Server"** butonuna tıkla
3. Sunucunu seç: **Dulundu.dev Vibe Coding Topluluğu**
4. İzinleri kontrol et:
   - ✅ Manage Roles (Rol Yönetimi)
   - ✅ Read Messages (Mesajları Okuma)
   - ✅ Send Messages (Mesaj Gönderme)
   - ✅ Manage Messages (Mesaj Yönetimi)
   - ✅ Add Reactions (Reaksiyon Ekleme)
5. **"Authorize"** (Yetkilendir) butonuna bas
6. CAPTCHA doğrulamasını tamamla

### Adım 1.2: Rol Hiyerarşisini Düzenle
**ÇOK ÖNEMLİ:** Carl-bot'un rolleri vermesi için bot'un rolü, vereceği rollerden YUKARDA olmalı!

1. Discord'da **Sunucu Ayarları** > **Roller** git
2. **Carl-bot** rolünü sürükleyerek yukarı taşı
3. Sıralama şöyle olmalı:
   ```
   👑 Kurucu
   🛡️ Moderatör
   🤖 Carl-bot        ← BU YUKARDA OLMALI!
   ⭐ Kıdemli Developer
   💻 Developer
   🎨 Tasarımcı
   🚀 Aktif Üye
   🎯 VIP Üye
   🌱 Yeni Başlayan
   👤 Üye
   @everyone
   ```

---

## 2. Rol Seçimi Mesajı Oluşturma

### Adım 2.1: Carl-bot Dashboard'a Git
1. https://carl.gg/dashboard adresine git
2. **Dulundu.dev Vibe Coding Topluluğu** sunucusunu seç
3. Sol menüden **"Reaction Roles"** sekmesini aç

### Adım 2.2: Özel Mesaj Oluştur (Embed)

**Seçenek A: Dashboard'dan Oluştur**
1. "Create new reaction role" buton tıkla
2. "Message" bölümüne aşağıdaki metni yapıştır:

```
🎯 **ROL SEÇİMİ**

Aşağıdaki emoji'lere tıklayarak istediğiniz rolleri alabilirsiniz!

**💻 Developer Rolleri**
💻 - **Developer** → Aktif yazılımcılar
⭐ - **Kıdemli Developer** → Deneyimli geliştiriciler
🌱 - **Yeni Başlayan** → Yeni öğrenenler

**🎨 Özel Roller**
🎨 - **Tasarımcı** → UI/UX tasarımcılar
🚀 - **Aktif Üye** → Toplulukta aktif olanlar

**🛠️ Teknoloji Rolleri**
🐍 - **Python** → Python geliştiricileri
💛 - **JavaScript** → JS/TS geliştiricileri
☕ - **Java** → Java geliştiricileri
⚙️ - **C/C++** → C/C++ geliştiricileri
🌐 - **Web Dev** → Frontend/Backend web geliştiricileri
📱 - **Mobile** → iOS/Android geliştiricileri
🎮 - **Game Dev** → Oyun geliştiricileri
🗄️ - **Database** → Veritabanı uzmanları
🔐 - **Backend** → Backend geliştiricileri
🚀 - **DevOps** → DevOps/Cloud uzmanları

---
💡 **Nasıl Kullanılır?**
Emoji'ye tıkla = Rol al ✅
Emoji'yi kaldır = Rol sil ❌
```

3. Channel seç: `#🎯┃rol-seçimi`
4. "Save" butonuna bas

**Seçenek B: Discord'da Komutla Oluştur**

Discord'un `#🎯┃rol-seçimi` kanalına git ve şu komutu kullan:

```
!rr create
```

Bot sana sorular soracak, yukarıdaki metni kopyala-yapıştır.

---

## 3. Rolleri Ekleyerek Reaksiyon Kurulumu

### Yöntem 1: Dashboard'dan (Kolay)

Carl-bot dashboard'da reaction role oluşturduktan sonra:

1. Her emoji için "Add emoji" tıkla
2. Emoji'yi seç
3. Rolü seç
4. "Save" bas

### Yöntem 2: Discord Komutları (Hızlı)

`#🤖┃bot-komutları` kanalına git ve aşağıdaki komutları **SIRAYlA** çalıştır:

```discord
!rr create #🎯┃rol-seçimi

!rr add latest 💻 @💻 Developer
!rr add latest ⭐ @⭐ Kıdemli Developer
!rr add latest 🌱 @🌱 Yeni Başlayan
!rr add latest 🎨 @🎨 Tasarımcı
!rr add latest 🚀 @🚀 Aktif Üye

!rr add latest 🐍 @Python
!rr add latest 💛 @JavaScript
!rr add latest ☕ @Java
!rr add latest ⚙️ @C-C++
!rr add latest 🌐 @Web Development
!rr add latest 📱 @Mobile Dev
!rr add latest 🎮 @Game Dev
!rr add latest 🗄️ @Database
!rr add latest 🔐 @Backend
!rr add latest 🚀 @DevOps
```

**NOT:** Teknoloji rolleri henüz yoksa, önce rolleri oluşturman gerekir!

---

## 4. Teknoloji Rollerini Oluşturma

Eğer template'de teknoloji rolleri yoksa, Discord'da manuel oluştur:

**Sunucu Ayarları > Roller > Yeni Rol Oluştur**

| Rol İsmi | Emoji | Renk | İzinler |
|----------|-------|------|---------|
| Python | 🐍 | Mavi (#3776AB) | Standart üye |
| JavaScript | 💛 | Sarı (#F7DF1E) | Standart üye |
| Java | ☕ | Turuncu (#ED8B00) | Standart üye |
| C-C++ | ⚙️ | Gri (#A8B9CC) | Standart üye |
| Web Development | 🌐 | Turkuaz (#20C997) | Standart üye |
| Mobile Dev | 📱 | Yeşil (#5CB85C) | Standart üye |
| Game Dev | 🎮 | Mor (#8E44AD) | Standart üye |
| Database | 🗄️ | Kahverengi (#8B4513) | Standart üye |
| Backend | 🔐 | Koyu Mavi (#2C3E50) | Standart üye |
| DevOps | 🚀 | Turuncu (#E67E22) | Standart üye |

---

## 5. Test ve Doğrulama

### Adım 5.1: Bot Mesajını Kontrol Et
1. `#🎯┃rol-seçimi` kanalına git
2. Carl-bot'un gönderdiği mesajı gör
3. Tüm emoji'lerin eklendiğinden emin ol

### Adım 5.2: Rolleri Test Et
1. Bir emoji'ye tıkla (örn: 💻)
2. Rolün verildiğini kontrol et (profilinde görünecek)
3. Emoji'yi kaldır
4. Rolün silindiğini kontrol et

### Adım 5.3: Çoklu Rol Testi
1. Birden fazla emoji'ye tıkla
2. Tüm rollerin verildiğini doğrula

---

## 6. Gelişmiş Ayarlar

### 6.1: Tek Rol Modu (Exclusive Roles)
Kullanıcı sadece 1 rol alsın istersen:

```
!rr mode latest unique
```

### 6.2: Rol Verme Limiti
Maksimum 3 rol alsın:

```
!rr limit latest 3
```

### 6.3: Rol Kaldırma Engelleme
Kullanıcı rolü kaldıramasın:

```
!rr remove latest disabled
```

### 6.4: Rol Gereksinimi
Belirli bir role sahip olanlar alsın:

```
!rr requirement latest @👤 Üye
```

---

## 7. Sorun Giderme

### Problem: Bot emoji eklemiyor
**Çözüm:**
- Carl-bot'un "Add Reactions" izni var mı kontrol et
- Kanalı görebiliyor mu kontrol et
- `!rr fix` komutunu dene

### Problem: Rol verilmiyor
**Çözüm:**
- Carl-bot rolü, vereceği rollerin ÜZERİNDE mi?
- Sunucu Ayarları > Roller > Sırala
- Bot'un "Manage Roles" izni var mı?

### Problem: Emoji bulunamıyor
**Çözüm:**
- Standart Discord emoji'leri kullan
- Özel emoji kullanıyorsan, bot o sunucuda olmalı
- Emoji ID'sini kullan: `<:emoji_name:emoji_id>`

### Problem: Mesaj silinmiş
**Çözüm:**
```
!rr create #🎯┃rol-seçimi
```
Mesajı yeniden oluştur ve rolleri tekrar ekle

---

## 8. Faydalı Carl-bot Komutları

| Komut | Açıklama |
|-------|----------|
| `!rr list` | Tüm reaction role'leri listele |
| `!rr edit <message_id>` | Mesajı düzenle |
| `!rr delete <message_id>` | Reaction role'ü sil |
| `!rr fix` | Bozuk reaction role'leri düzelt |
| `!rr clear <message_id>` | Tüm reaksiyonları temizle |
| `!help reactionroles` | Detaylı yardım |

---

## 9. Dashboard Kullanımı (Alternatif)

Web arayüzü kullanmak istersen:

1. https://carl.gg/dashboard git
2. Sunucunu seç
3. **Reaction Roles** > **Create New**
4. Visual editor kullanarak:
   - Embed tasarla
   - Emoji ekle
   - Rolleri ata
   - Önizle
   - Yayınla

**Avantajları:**
- ✅ Görsel tasarım
- ✅ Önizleme
- ✅ Kolay düzenleme
- ✅ Daha fazla özelleştirme

---

## 10. Örnek Komut Sırası (Kopyala-Yapıştır)

Tüm sistemi 5 dakikada kurmak için:

```bash
# 1. Mesaj oluştur
!rr create #🎯┃rol-seçimi

# 2. Developer rolleri ekle
!rr add latest 💻 @💻 Developer
!rr add latest ⭐ @⭐ Kıdemli Developer
!rr add latest 🌱 @🌱 Yeni Başlayan
!rr add latest 🎨 @🎨 Tasarımcı
!rr add latest 🚀 @🚀 Aktif Üye

# 3. Teknoloji rolleri ekle (rolleri önceden oluştur!)
!rr add latest 🐍 @Python
!rr add latest 💛 @JavaScript
!rr add latest ☕ @Java
!rr add latest ⚙️ @C-C++

# 4. Test et!
# Emoji'lere tıkla ve rollerin verildiğini kontrol et
```

---

## 📚 Ek Kaynaklar

- **Carl-bot Dokümantasyon:** https://docs.carl.gg
- **Discord:** https://carl.gg/discord
- **Video Rehber:** YouTube'da "Carl-bot reaction roles tutorial" ara

---

## ✅ Kontrol Listesi

Kurulum tamamlandı mı?

- [ ] Carl-bot sunucuya eklendi
- [ ] Bot rolü doğru pozisyonda (verilecek rollerin üzerinde)
- [ ] Rol seçimi mesajı oluşturuldu
- [ ] Tüm emoji'ler eklendi
- [ ] Tüm roller atandı
- [ ] Roller test edildi ve çalışıyor
- [ ] Kullanıcılara duyuru yapıldı

---

**Hazırladı:** Claude Code
**Tarih:** 2025-11-17
**İçin:** Dulundu.dev Vibe Coding Topluluğu

Başarılar! 🚀
