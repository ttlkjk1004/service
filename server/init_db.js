const db = require('./database');

setTimeout(() => {
    console.log('Database initialized.');
    process.exit(0);
}, 2000);
