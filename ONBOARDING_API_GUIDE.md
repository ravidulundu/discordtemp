# Discord Guild Onboarding API - Tam Referans Kılavuzu

## 1. Discord API TypeScript Tip Açıklaması

### Discord API Katmanları (discord-api-types)

Discord Onboarding yapısı 3 seviyeden oluşur:

```
GuildOnboarding
  ├── prompts[] (OnboardingPrompt)
  │     ├── options[] (OnboardingPromptOption)  ← role_ids ve channel_ids BURADA
  │     └── ...
  └── default_channel_ids[]
```

### Kritik Alan: `role_ids` ve `channel_ids`

**NEREDE:** `OnboardingPromptOption` içinde (prompt içinde DEĞİL!)

**TİP:** `Snowflake[]` = `string[]` (Discord ID'leri)

**ÖRNEK:**
```typescript
// ✅ DOĞRU
{
  "title": "Backend Developer",
  "role_ids": ["1234567890123456789", "9876543210987654321"],  // string[]
  "channel_ids": ["1111222233334444555"]                        // string[]
}

// ❌ YANLIŞ
{
  "title": "Backend Developer",
  "roleIds": ["123"],           // camelCase YANLIŞ (API snake_case bekler)
  "role_ids": "123",            // Tekil string YANLIŞ (array olmalı)
  "role_ids": [{ id: "123" }]   // Obje YANLIŞ (sadece ID string)
}
```

---

## 2. TypeScript Interface Tanımları

### discord-api-types Uyumlu Tam Interface

```typescript
// Kaynak: discord-api-types/v10/guild.ts
// https://github.com/discordjs/discord-api-types

/**
 * Snowflake = Discord ID (string)
 */
type Snowflake = string;

/**
 * Discord API Onboarding Prompt Option
 *
 * @see https://discord.com/developers/docs/resources/guild#guild-onboarding-object-prompt-option-structure
 */
interface APIGuildOnboardingPromptOption {
  /**
   * ID of the prompt option (Discord tarafından otomatik atanır)
   */
  id: Snowflake;

  /**
   * IDs for channels a member is added to when the option is selected
   *
   * @remarks
   * - MUTLAKA string[] (Snowflake[]) olmalı
   * - Kanal objeleri DEĞİL, sadece ID'ler
   * - Boş array ([]) geçerlidir
   */
  channel_ids: Snowflake[];

  /**
   * IDs for roles assigned to a member when the option is selected
   *
   * @remarks
   * - MUTLAKA string[] (Snowflake[]) olmalı
   * - Rol objeleri DEĞİL, sadece ID'ler
   * - Boş array ([]) geçerlidir
   */
  role_ids: Snowflake[];

  /**
   * Emoji for the option
   *
   * @remarks
   * - Unicode emoji için: { name: "🎯" }
   * - Custom emoji için: { id: "123456789", name: "custom_emoji" }
   */
  emoji: APIPartialEmoji;

  /**
   * Title of the option
   *
   * @remarks
   * Kullanıcıya gösterilen seçenek başlığı
   */
  title: string;

  /**
   * Description of the option
   *
   * @remarks
   * Kullanıcıya gösterilen açıklama (opsiyonel)
   */
  description: string | null;
}

/**
 * Partial Emoji yapısı
 */
interface APIPartialEmoji {
  /**
   * Emoji ID (custom emoji için, unicode için null)
   */
  id?: Snowflake | null;

  /**
   * Emoji name (unicode emoji: "🎯", custom emoji: "emoji_name")
   */
  name?: string | null;

  /**
   * Whether this emoji is animated
   */
  animated?: boolean;
}

/**
 * Discord API Onboarding Prompt
 */
interface APIGuildOnboardingPrompt {
  /**
   * ID of the prompt
   */
  id: Snowflake;

  /**
   * Type of prompt (0 = MULTIPLE_CHOICE, 1 = DROPDOWN)
   */
  type: 0 | 1;

  /**
   * Options available within the prompt
   */
  options: APIGuildOnboardingPromptOption[];

  /**
   * Title of the prompt
   */
  title: string;

  /**
   * Indicates whether users are limited to selecting one option for the prompt
   */
  single_select: boolean;

  /**
   * Indicates whether the prompt is required before a user completes the onboarding flow
   */
  required: boolean;

  /**
   * Indicates whether the prompt is present in the onboarding flow
   */
  in_onboarding: boolean;
}

/**
 * Discord API Guild Onboarding
 */
interface APIGuildOnboarding {
  /**
   * ID of the guild this onboarding is part of
   */
  guild_id: Snowflake;

  /**
   * Prompts shown during onboarding
   */
  prompts: APIGuildOnboardingPrompt[];

  /**
   * Channel IDs that members get opted into automatically
   */
  default_channel_ids: Snowflake[];

  /**
   * Whether onboarding is enabled in the guild
   */
  enabled: boolean;

  /**
   * Current mode of onboarding (0 = ONBOARDING_DEFAULT, 1 = ONBOARDING_ADVANCED)
   */
  mode: 0 | 1;
}
```

---

## 3. Pratik Örnekler

### Örnek 1: Sadece `role_ids` Kullanımı

```json
{
  "id": "prompt_option_1",
  "title": "Backend Developer",
  "description": "Sunucu tarafı geliştirme ve API tasarımı",
  "emoji": {
    "name": "🔐"
  },
  "role_ids": [
    "1439826350071484467",
    "1439826338872688740"
  ],
  "channel_ids": []
}
```

**Açıklama:**
- ✅ `role_ids` = string array (2 rol ID'si)
- ✅ `channel_ids` = boş array (kanal atanmıyor)
- ✅ `emoji` = Unicode emoji objesi
- ✅ Kullanıcı bu seçeneği seçerse 2 rol alır

### Örnek 2: Hem `role_ids` Hem `channel_ids` Kullanımı

```json
{
  "id": "prompt_option_2",
  "title": "AI & Machine Learning",
  "description": "Yapay zeka ve makine öğrenmesi projeleri",
  "emoji": {
    "name": "🤖"
  },
  "role_ids": [
    "1439826353682911263"
  ],
  "channel_ids": [
    "1439826460123456789",
    "1439826470987654321"
  ]
}
```

**Açıklama:**
- ✅ `role_ids` = 1 rol ID'si (AI rolü)
- ✅ `channel_ids` = 2 kanal ID'si (AI kanallarına otomatik erişim)
- ✅ Kullanıcı bu seçeneği seçerse 1 rol + 2 kanala erişim alır

### Örnek 3: Tam Onboarding Prompt (Multi-Option)

```json
{
  "id": "prompt_tech_stack",
  "type": 0,
  "title": "Hangi teknoloji stack'i kullanıyorsun?",
  "single_select": false,
  "required": true,
  "in_onboarding": true,
  "options": [
    {
      "id": "option_javascript",
      "title": "JavaScript/TypeScript",
      "description": "Node.js, React, Vue, Angular",
      "emoji": {
        "name": "⚡"
      },
      "role_ids": ["1439826360000000001"],
      "channel_ids": ["1439826360000000101", "1439826360000000102"]
    },
    {
      "id": "option_python",
      "title": "Python",
      "description": "Django, Flask, FastAPI, Data Science",
      "emoji": {
        "name": "🐍"
      },
      "role_ids": ["1439826360000000002"],
      "channel_ids": ["1439826360000000201"]
    },
    {
      "id": "option_rust",
      "title": "Rust",
      "description": "Systems programming, WebAssembly",
      "emoji": {
        "name": "🦀"
      },
      "role_ids": ["1439826360000000003"],
      "channel_ids": []
    }
  ]
}
```

---

## 4. vibe-coding-template.json Hata Analizi ve Düzeltmeler

### 🔴 SORUN 1: camelCase Kullanımı (`roleIds` vs `role_ids`)

**Hatalı JSON (Satır 760-762):**
```json
{
  "title": "Fullstack",
  "description": "Hem frontend hem backend",
  "emoji": {
    "name": "🌐"
  },
  "roleIds": [          // ❌ HATALI: camelCase
    "12"
  ]
}
```

**Düzeltilmiş JSON:**
```json
{
  "title": "Fullstack",
  "description": "Hem frontend hem backend",
  "emoji": {
    "name": "🌐"
  },
  "role_ids": [         // ✅ DOĞRU: snake_case
    "12"
  ],
  "channel_ids": []     // ✅ EKLENDI: Boş da olsa olmalı
}
```

**Neden Düzeltilmeli:**
- Discord REST API **snake_case** bekler (`role_ids`, `channel_ids`)
- Discord.js kütüphanesi internal olarak dönüşüm yapar AMA:
  - `guild.editOnboarding()` methodunda Discord.js `role_ids` ve `channel_ids` bekler
  - Eğer `roleIds` gönderirsen, Discord.js bunu tanımaz ve REST API'ye göndermez
  - Sonuç: API hatası alırsın

### 🔴 SORUN 2: `channel_ids` Eksik

**Hatalı JSON:**
```json
{
  "title": "Backend",
  "description": "Sunucu tarafı geliştirme",
  "emoji": {
    "name": "🔐"
  },
  "roleIds": ["13"]
  // channel_ids YOK ❌
}
```

**Düzeltilmiş JSON:**
```json
{
  "title": "Backend",
  "description": "Sunucu tarafı geliştirme",
  "emoji": {
    "name": "🔐"
  },
  "role_ids": ["13"],
  "channel_ids": []        // ✅ EKLENDI
}
```

**Neden Düzeltilmeli:**
- Discord API `channel_ids` alanını bekler (opsiyonel ama mevcut olmalı)
- Eğer kanal atanmayacaksa boş array (`[]`) gönder
- `undefined` veya eksik bırakma

### 🔴 SORUN 3: Emoji Yapısı

**Mevcut JSON (Satır 757-759):**
```json
"emoji": {
  "name": "🌐"
}
```

**Durum:** ✅ DOĞRU (Unicode emoji için)

**Açıklama:**
- Unicode emoji için: `{ "name": "🎯" }` ✅
- Custom emoji için: `{ "id": "123456", "name": "emoji_name" }` ✅
- Sadece string: `"🎯"` ❌ (Obje olmalı)

---

## 5. Tam Düzeltilmiş Onboarding Örneği

### Template için Tam Kullanıma Hazır JSON

```json
{
  "onboarding": {
    "enabled": true,
    "mode": 0,
    "prompts": [
      {
        "id": "prompt_stack",
        "type": 0,
        "title": "Hangi yazılım alanlarında çalışıyorsun?",
        "single_select": false,
        "required": true,
        "in_onboarding": true,
        "options": [
          {
            "id": "option_fullstack",
            "title": "Fullstack",
            "description": "Hem frontend hem backend",
            "emoji": {
              "name": "🌐"
            },
            "role_ids": ["1439826348599148608"],
            "channel_ids": []
          },
          {
            "id": "option_backend",
            "title": "Backend",
            "description": "Sunucu tarafı geliştirme",
            "emoji": {
              "name": "🔐"
            },
            "role_ids": ["1439826350071484467"],
            "channel_ids": ["1439826470000000001"]
          },
          {
            "id": "option_ai",
            "title": "AI & Machine Learning",
            "description": "Yapay zeka projeleri",
            "emoji": {
              "name": "🤖"
            },
            "role_ids": ["1439826353682911263"],
            "channel_ids": [
              "1439826470000000101",
              "1439826470000000102"
            ]
          }
        ]
      },
      {
        "id": "prompt_experience",
        "type": 0,
        "title": "Tecrübe seviyeniz?",
        "single_select": true,
        "required": true,
        "in_onboarding": true,
        "options": [
          {
            "id": "option_junior",
            "title": "Junior Developer",
            "description": "0-2 yıl tecrübe",
            "emoji": {
              "name": "🌱"
            },
            "role_ids": ["1439826339715616932"],
            "channel_ids": []
          },
          {
            "id": "option_mid",
            "title": "Mid-Level Developer",
            "description": "2-5 yıl tecrübe",
            "emoji": {
              "name": "💻"
            },
            "role_ids": ["1439826338872688740"],
            "channel_ids": []
          },
          {
            "id": "option_senior",
            "title": "Senior Developer",
            "description": "5+ yıl tecrübe",
            "emoji": {
              "name": "⭐"
            },
            "role_ids": ["1439826337207419053"],
            "channel_ids": ["1439826470000000201"]
          }
        ]
      }
    ],
    "default_channel_ids": [
      "1439826360000000001",
      "1439826360000000002",
      "1439826360000000003",
      "1439826360000000004",
      "1439826360000000005",
      "1439826360000000006",
      "1439826360000000007"
    ]
  }
}
```

---

## 6. deploy_template.js İçin Düzeltme

Şu anki kodunuz muhtemelen `roleIds`'i `roles`'a çeviriyor:

```javascript
// ❌ MEVCUT KOD (deploy_template.js)
return {
    title: optionData.title,
    description: optionData.description || '',
    emoji: optionData.emoji ? { name: optionData.emoji.name } : null,
    roles: roleIds,     // ← Discord.js için
    channels: []
};
```

**Sorun:** Template'de `roleIds` yazıyor, kod `roles` bekliyor!

**Çözüm 1: Template'i Düzelt (ÖNERİLEN)**

vibe-coding-template.json'da tüm `roleIds` → `role_ids` değiştir:

```bash
# Otomatik düzeltme:
sed -i 's/"roleIds":/"role_ids":/g' vibe-coding-template.json
```

**Çözüm 2: deploy_template.js'de Mapping**

```javascript
// Template'den gelen roleIds'i role_ids'e çevir
const option = {
    title: optionData.title,
    description: optionData.description || '',
    emoji: optionData.emoji ? { name: optionData.emoji.name } : null
};

// Template'de roleIds varsa role_ids'e çevir
if (optionData.roleIds && optionData.roleIds.length > 0) {
    option.role_ids = optionData.roleIds.map(templateId => {
        const role = this.roleMap.get(templateId);
        return role ? role.id : null;
    }).filter(id => id !== null);
}

// Template'de channelIds varsa channel_ids'e çevir
if (optionData.channelIds) {
    option.channel_ids = optionData.channelIds.map(templateId => {
        const channel = this.channelMap.get(templateId);
        return channel ? channel.id : null;
    }).filter(id => id !== null);
} else {
    option.channel_ids = [];
}

// Discord.js guild.editOnboarding() için
// Sonra option'ı prompts'a ekle
```

---

## 7. Kontrol Listesi

### Template JSON Kontrol

- [ ] Tüm `roleIds` → `role_ids` değiştirildi mi?
- [ ] Tüm `channelIds` → `channel_ids` değiştirildi mi?
- [ ] Her option'da `channel_ids: []` var mı (boş da olsa)?
- [ ] Emoji objesi `{ name: "🎯" }` formatında mı?
- [ ] ID'ler string mi? (`"123"` ✅, `123` ❌)
- [ ] ID'ler array içinde mi? (`["123"]` ✅, `"123"` ❌)

### Discord.js Kod Kontrol

- [ ] `guild.editOnboarding()` kullanıyorsanız:
  - [ ] Field adları snake_case (`role_ids`, `channel_ids`)
  - [ ] ID'ler Snowflake string array
  - [ ] Template ID'leri gerçek Discord ID'lere çevriliyor mu?

### API Gereksinimleri

- [ ] Onboarding için en az 7 `default_channel_ids` var mı?
- [ ] Bu kanalların en az 5'i @everyone için View+Send izinli mi?
- [ ] Community Server etkin mi?

---

## 8. Hızlı Referans Tablosu

| Alan | Seviye | Tip | Zorunlu | Açıklama |
|------|--------|-----|---------|----------|
| `role_ids` | PromptOption | `string[]` | Hayır | Bu seçenek seçildiğinde atanan rol ID'leri |
| `channel_ids` | PromptOption | `string[]` | Hayır | Bu seçenek seçildiğinde erişim verilen kanal ID'leri |
| `emoji` | PromptOption | `object` | Evet | `{ name: "🎯" }` veya `{ id: "123", name: "custom" }` |
| `title` | PromptOption | `string` | Evet | Seçenek başlığı |
| `description` | PromptOption | `string \| null` | Hayır | Seçenek açıklaması |
| `id` | PromptOption | `Snowflake` | Evet | Discord tarafından atanan ID |
| `default_channel_ids` | Onboarding | `string[]` | Evet | Otomatik eklenen kanallar (min 7) |
| `prompts` | Onboarding | `Prompt[]` | Evet | Onboarding soruları |
| `enabled` | Onboarding | `boolean` | Evet | Onboarding aktif mi? |
| `mode` | Onboarding | `0 \| 1` | Evet | 0=Default, 1=Advanced |

---

## 9. Sık Yapılan Hatalar

### ❌ Hata: Obje Gönderme

```json
// YANLIŞ
"role_ids": [{ "id": "123", "name": "Role" }]

// DOĞRU
"role_ids": ["123"]
```

### ❌ Hata: Tekil String

```json
// YANLIŞ
"role_ids": "123456789"

// DOĞRU
"role_ids": ["123456789"]
```

### ❌ Hata: camelCase

```json
// YANLIŞ (Discord API için)
"roleIds": ["123"]

// DOĞRU
"role_ids": ["123"]
```

### ❌ Hata: Number Kullanma

```json
// YANLIŞ
"role_ids": [123456789]

// DOĞRU
"role_ids": ["123456789"]
```

---

## 10. Test Kodu

```typescript
// TypeScript ile validasyon
import { APIGuildOnboardingPromptOption } from 'discord-api-types/v10';

function validatePromptOption(option: unknown): option is APIGuildOnboardingPromptOption {
  const opt = option as APIGuildOnboardingPromptOption;

  // ID kontrolü
  if (typeof opt.id !== 'string') return false;

  // role_ids kontrolü
  if (!Array.isArray(opt.role_ids)) return false;
  if (!opt.role_ids.every(id => typeof id === 'string')) return false;

  // channel_ids kontrolü
  if (!Array.isArray(opt.channel_ids)) return false;
  if (!opt.channel_ids.every(id => typeof id === 'string')) return false;

  // emoji kontrolü
  if (!opt.emoji || typeof opt.emoji !== 'object') return false;

  // title kontrolü
  if (typeof opt.title !== 'string' || opt.title.length === 0) return false;

  return true;
}

// Kullanım
const option = {
  id: "123",
  title: "Backend Dev",
  description: "Server-side development",
  emoji: { name: "🔐" },
  role_ids: ["456", "789"],
  channel_ids: []
};

if (validatePromptOption(option)) {
  console.log("✅ Geçerli onboarding option!");
} else {
  console.log("❌ Hatalı format!");
}
```

---

## Kaynaklar

- [Discord API Docs - Guild Onboarding](https://discord.com/developers/docs/resources/guild#guild-onboarding-object)
- [discord-api-types GitHub](https://github.com/discordjs/discord-api-types)
- [Discord.js v14 Docs](https://discord.js.org/docs/packages/discord.js/14.14.1)
- [Discord Community Onboarding FAQ](https://support.discord.com/hc/en-us/articles/11074987197975)

