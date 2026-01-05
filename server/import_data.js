const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Configuration
const EXCEL_FILENAME = 'hospital_data.xlsx';
const DB_PATH = path.resolve(__dirname, 'service_reports.db');

// Verify file exists
if (!fs.existsSync(path.join(__dirname, EXCEL_FILENAME))) {
    console.error(`Error: File '${EXCEL_FILENAME}' not found in the server directory.`);
    console.error('Please copy your Excel file to:', path.resolve(__dirname));
    console.error('And rename it to:', EXCEL_FILENAME);
    process.exit(1);
}

// Connect to Database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log(`Connected to database at: ${DB_PATH}`);
});

// Read Excel File
try {
    const workbook = xlsx.readFile(path.join(__dirname, EXCEL_FILENAME));
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log(`Found ${data.length} records in '${sheetName}' sheet.`);

    // Import Data
    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO hospitals (name, address, city, region) VALUES (?, ?, ?, ?)");

        let successCount = 0;
        let errorCount = 0;

        db.run("BEGIN TRANSACTION");

        data.forEach((row, index) => {
            // Map Korean headers
            const name = row['병원이름'];
            const region = row['지역'];
            const city = row['세부지역'];
            const address = `${region} ${city}`; // Construct simple address

            if (name) {
                stmt.run(name, address, city, region, (err) => {
                    if (err) {
                        // console.error(`Error inserting row ${index + 2}: ${err.message}`);
                        errorCount++;
                    }
                });
                successCount++;
            }
        });

        stmt.finalize();

        db.run("COMMIT", (err) => {
            if (err) {
                console.error('Transaction commit failed:', err.message);
            } else {
                console.log(`\nImport completed successfully!`);
                console.log(`Imported: ${successCount} records`);
            }
            db.close();
        });
    });

} catch (error) {
    console.error('Error processing Excel file:', error.message);
    db.close();
}
