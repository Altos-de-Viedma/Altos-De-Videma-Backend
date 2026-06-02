const { DataSource } = require('typeorm');
const myDataSource = new DataSource({
    type: 'postgres',
    host: 'hpanel.neurabig.com',
    port: 7631,
    username: 'postgres',
    password: 'O7FsGwcxsaW3KLkGPaofI18jeSqAFVvqfGMKP8EzLqS7N0dCCphcqxbQChQ7pnV6',
    database: 'postgres',
    entities: [__dirname + '/dist/**/*.entity.js'],
});
myDataSource.initialize().then(async () => {
    const results = await myDataSource.query('SELECT EXTRACT(YEAR FROM "transactionDate") as year, EXTRACT(MONTH FROM "transactionDate") as month, COUNT(*) as count FROM daily_cash_transactions WHERE "isActive" = true GROUP BY EXTRACT(YEAR FROM "transactionDate"), EXTRACT(MONTH FROM "transactionDate") ORDER BY year DESC, month DESC');
    console.log(results);
    myDataSource.destroy();
}).catch(console.error);
