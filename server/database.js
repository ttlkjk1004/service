const sqlite3 = require('sqlite3').verbose();

const path = require('path');

// Connect to SQLite database (file-based)
const dbPath = path.resolve(__dirname, 'service_reports.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Define Schema
db.serialize(() => {
    // Hospitals Table
    db.run(`CREATE TABLE IF NOT EXISTS hospitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        products TEXT,
        system TEXT,
        installation_date TEXT,
        device_type TEXT,
        serial_number TEXT,
        revision_firmware TEXT,
        software_version TEXT
    )`);

    // Reports Table - Dropping old table for schema update (Dev mode only)
    db.run("DROP TABLE IF EXISTS reports", () => {
        db.run(`CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hospitalId INTEGER,
            hospitalName TEXT,
            location TEXT,
            products TEXT,
            system TEXT,
            warranty TEXT,
            activityType TEXT, -- JSON string
            deviceDetails TEXT, -- JSON string
            subject TEXT,
            serviceDetails TEXT, -- Activity description
            partsDetails TEXT, -- JSON string
            serviceHours TEXT, -- JSON string
            servicerName TEXT,
            customerName TEXT,
            serviceDate TEXT,
            servicerSignature TEXT,
            customerSignature TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    });

    // Seed Data (if empty)
    db.get("SELECT count(*) as count FROM hospitals", (err, row) => {
        if (err) return console.error(err.message);
        if (row.count === 0) {
            console.log("Seeding initial hospital data...");
            const stmt = db.prepare("INSERT INTO hospitals (name, location, products, system) VALUES (?, ?, ?, ?)");
            // Placeholder data 
            const seedData = [
                ["Seoul National University Hospital", "Seoul", "LAP", "LUNA3D"],
                ["Asan Medical Center", "Seoul", "LAP", "LUNA3D"],
                ["Samsung Medical Center", "Seoul", "LAP", "LUNA3D"],
                ["Severance Hospital", "Seoul", "LAP", "LUNA3D"],
                ["Busan National University Hospital", "Busan", "LAP", "LUNA3D"]
            ];
            seedData.forEach(data => stmt.run(data));
            stmt.finalize();
        }
    });
});

module.exports = db;
