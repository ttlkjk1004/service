const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, 'service_reports.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    console.log("Dropping hospitals table...");
    db.run("DROP TABLE IF EXISTS hospitals", (err) => {
        if (err) {
            console.error("Error dropping table:", err.message);
            process.exit(1);
        }
        console.log("Table dropped.");

        // Now trigger recreation by loading database.js
        console.log("Recreating schema...");
        try {
            // we need to invalidate cache if it was already loaded, but here it's a fresh process
            require('./database');

            // Give it a moment to finish schema creation
            setTimeout(() => {
                console.log("Schema recreation initiated.");
                process.exit(0);
            }, 1000);
        } catch (e) {
            console.error("Error reloading database module:", e);
        }
    });
});
