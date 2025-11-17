/**
 * Bot Davet Linki Oluşturucu
 *
 * Kullanım:
 *     node generate_invite.js YOUR_BOT_CLIENT_ID
 */

const clientId = process.argv[2];

if (!clientId) {
    console.log('❌ Bot Client ID gerekli!');
    console.log('\nKullanım:');
    console.log('  node generate_invite.js YOUR_BOT_CLIENT_ID');
    console.log('\nBot Client ID\'yi şuradan alabilirsin:');
    console.log('  https://discord.com/developers/applications');
    console.log('  → Uygulamanı seç → General Information → Application ID');
    process.exit(1);
}

// Bot için gerekli izinler
const permissions = [
    'ManageGuild',       // Sunucu ayarlarını yönet
    'ManageRoles',       // Rolleri yönet
    'ManageChannels',    // Kanalları yönet
    'ViewAuditLog',      // Denetim günlüğünü görüntüle
    'ModerateMembers',   // Üyeleri yönet
    'ManageWebhooks',    // Webhook'ları yönet
    'Administrator'      // Admin (en güvenli)
].join('%20');

// Administrator permission value
const adminPermission = '8';

const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${adminPermission}&scope=bot%20applications.commands`;

console.log('============================================================');
console.log('Discord Bot Davet Linki');
console.log('============================================================\n');
console.log('🔗 Bot Davet Linki:');
console.log(inviteUrl);
console.log('\n📋 Adımlar:');
console.log('1. Yukarıdaki linke tarayıcıdan gir');
console.log('2. Sunucunu seç (Dulundu.dev)');
console.log('3. "Yetkilendir" butonuna tıkla');
console.log('4. Bot sunucuya eklenecek (Administrator izinleri ile)');
console.log('\n✅ Bot eklendikten sonra deploy_template.js\'i çalıştır!');
console.log('============================================================\n');
