/**
 * Bot Token'dan Client ID Çıkarıcı
 *
 * Kullanım:
 *     node get_bot_id.js YOUR_BOT_TOKEN
 */

const token = process.argv[2];

if (!token) {
    console.log('❌ Bot token gerekli!');
    console.log('\nKullanım:');
    console.log('  node get_bot_id.js YOUR_BOT_TOKEN');
    process.exit(1);
}

try {
    // Discord token formatı: BOT_ID.TIMESTAMP.SIGNATURE
    // İlk kısım bot ID'si (base64 encoded)
    const parts = token.split('.');

    if (parts.length < 3) {
        console.log('❌ Geçersiz token formatı!');
        console.log('Token formatı: BOT_ID.TIMESTAMP.SIGNATURE olmalı');
        process.exit(1);
    }

    // İlk kısmı base64 decode et
    const botIdBase64 = parts[0];
    const botId = Buffer.from(botIdBase64, 'base64').toString('utf-8');

    console.log('============================================================');
    console.log('Bot Client ID (Application ID)');
    console.log('============================================================\n');
    console.log('🆔 Bot Client ID:', botId);
    console.log('\n📋 Davet Linki Oluştur:');
    console.log(`  node generate_invite.js ${botId}`);
    console.log('\n============================================================\n');

} catch (error) {
    console.log('❌ Token decode edilemedi:', error.message);
    console.log('\nToken doğru mu kontrol et!');
    process.exit(1);
}
