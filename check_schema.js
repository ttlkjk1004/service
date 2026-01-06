const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/service_reports.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

db.all("PRAGMA table_info(hospitals)", (err, rows) => {
    if (err) {
        console.error('Error getting table info:', err.message);
    } else {
        console.log('Columns in hospitals table:');
        rows.forEach(row => console.log(row.name));
    }
    db.close();
});
