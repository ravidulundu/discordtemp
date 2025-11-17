/**
 * Bot Sunucu Kontrol
 * Bot'un hangi sunucularda olduğunu gösterir
 *
 * Kullanım:
 *     node check_bot.js YOUR_BOT_TOKEN
 */

const { Client, GatewayIntentBits } = require('discord.js');

const token = process.argv[2];

if (!token) {
    console.log('❌ Bot token gerekli!');
    console.log('\nKullanım:');
    console.log('  node check_bot.js YOUR_BOT_TOKEN');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', async () => {
    console.log('============================================================');
    console.log('Bot Sunucu Kontrolü');
    console.log('============================================================\n');
    console.log(`✅ Bot giriş yaptı: ${client.user.tag}`);
    console.log(`🆔 Bot ID: ${client.user.id}\n`);

    const guilds = client.guilds.cache;

    if (guilds.size === 0) {
        console.log('⚠️ Bot hiçbir sunucuda değil!\n');
        console.log('📋 Bot Davet Linki:');
        console.log(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands\n`);
    } else {
        console.log(`📊 Bot ${guilds.size} sunucuda:\n`);

        for (const [id, guild] of guilds) {
            console.log(`  📍 ${guild.name}`);
            console.log(`     ID: ${guild.id}`);
            console.log(`     Üye Sayısı: ${guild.memberCount}`);

            // Bot'un sunucudaki izinlerini kontrol et
            const me = await guild.members.fetchMe();
            const permissions = me.permissions.toArray();
            console.log(`     Bot İzinleri: ${permissions.slice(0, 5).join(', ')}${permissions.length > 5 ? '...' : ''}`);
            console.log('');
        }

        console.log('✅ Sunucu ID\'lerinden birini kullanarak deploy edebilirsin:');
        console.log('   node deploy_template.js YOUR_BOT_TOKEN SUNUCU_ID\n');
    }

    console.log('============================================================\n');
    await client.destroy();
    process.exit(0);
});

client.on('error', async (error) => {
    console.error('❌ Bot hatası:', error.message);
    await client.destroy();
    process.exit(1);
});

client.login(token).catch((error) => {
    console.error('❌ Bot giriş yapamadı:', error.message);
    console.log('\n💡 Token geçersiz olabilir. Yeni bir token oluştur:');
    console.log('   https://discord.com/developers/applications');
    console.log('   → Uygulamanı seç → Bot → Reset Token\n');
    process.exit(1);
});
