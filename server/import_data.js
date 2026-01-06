const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Configuration
const EXCEL_FILENAME = 'hospital_data.xlsx';

const importHospitals = (db) => {
    return new Promise((resolve, reject) => {
        // Verify file exists
        const filePath = path.join(__dirname, EXCEL_FILENAME);
        if (!fs.existsSync(filePath)) {
            const errorMsg = `Error: File '${EXCEL_FILENAME}' not found in ${__dirname}`;
            console.error(errorMsg);
            return reject(new Error(errorMsg));
        }

        try {
            console.log(`Reading Excel file: ${filePath}`);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);

            console.log(`Found ${data.length} records in '${sheetName}' sheet.`);

            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                // Clear existing data
                db.run("DELETE FROM hospitals", (err) => {
                    if (err) {
                        console.error('Error clearing table:', err.message);
                        db.run("ROLLBACK");
                        return reject(err);
                    }
                });

                // Reset ID counter
                db.run("DELETE FROM sqlite_sequence WHERE name='hospitals'");

                const stmt = db.prepare(`INSERT INTO hospitals (
                    name, location, products, system, installation_date, 
                    device_type, serial_number, revision_firmware, software_version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

                let successCount = 0;
                let errorCount = 0;

                data.forEach((row) => {
                    const name = row['Customer'];
                    const location = row['Location'];
                    const products = row['Products'];
                    const system = row['System'];
                    const installationDate = row['Installation date'];
                    const deviceType = row['Device type'];
                    const serialNumber = row['Serial number'];
                    const revisionFirmware = row['Revision/Firmware'];
                    const softwareVersion = row['Software version'];

                    if (name) {
                        stmt.run(
                            name, location, products, system, installationDate,
                            deviceType, serialNumber, revisionFirmware, softwareVersion,
                            (err) => {
                                if (err) errorCount++;
                            }
                        );
                        successCount++;
                    }
                });

                stmt.finalize();

                db.run("COMMIT", (err) => {
                    if (err) {
                        console.error('Transaction commit failed:', err.message);
                        db.run("ROLLBACK");
                        reject(err);
                    } else {
                        console.log(`Import completed. Added ${successCount} records.`);
                        resolve({ success: true, count: successCount });
                    }
                });
            });

        } catch (error) {
            console.error('Error processing Excel file:', error.message);
            reject(error);
        }
    });
};

module.exports = { importHospitals };
