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

            // Process each record
            const processRecords = async () => {
                let inserted = 0;
                let updated = 0;

                // Prepare statements
                const checkStmt = db.prepare("SELECT id FROM hospitals WHERE name = ?");
                const insertStmt = db.prepare(`INSERT INTO hospitals (
                        name, location, products, system, installation_date, 
                        device_type, serial_number, revision_firmware, software_version
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                const updateStmt = db.prepare(`UPDATE hospitals SET
                        location = ?, products = ?, system = ?, installation_date = ?, 
                        device_type = ?, serial_number = ?, revision_firmware = ?, software_version = ?
                        WHERE id = ?`);

                for (const row of data) {
                    const name = row['Customer'];
                    if (!name) continue;

                    const location = row['Location'];
                    const products = row['Products'];
                    const system = row['System'];
                    const installationDate = row['Installation date'];
                    const deviceType = row['Device type'];
                    const serialNumber = row['Serial number'];
                    const revisionFirmware = row['Revision/Firmware'];
                    const softwareVersion = row['Software version'];

                    try {
                        // Check if hospital exists
                        const existing = await new Promise((res, rej) => {
                            checkStmt.get(name, (err, row) => {
                                if (err) rej(err);
                                else res(row);
                            });
                        });

                        if (existing) {
                            // Update existing
                            await new Promise((res, rej) => {
                                updateStmt.run(
                                    location, products, system, installationDate,
                                    deviceType, serialNumber, revisionFirmware, softwareVersion,
                                    existing.id,
                                    (err) => err ? rej(err) : res()
                                );
                            });
                            updated++;
                        } else {
                            // Insert new
                            await new Promise((res, rej) => {
                                insertStmt.run(
                                    name, location, products, system, installationDate,
                                    deviceType, serialNumber, revisionFirmware, softwareVersion,
                                    (err) => err ? rej(err) : res()
                                );
                            });
                            inserted++;
                        }
                    } catch (err) {
                        console.error(`Error processing ${name}:`, err.message);
                        errorCount++;
                    }
                }

                checkStmt.finalize();
                insertStmt.finalize();
                updateStmt.finalize();

                return { inserted, updated };
            };

            processRecords().then(({ inserted, updated }) => {
                db.run("COMMIT", (err) => {
                    if (err) {
                        console.error('Transaction commit failed:', err.message);
                        db.run("ROLLBACK");
                        reject(err);
                    } else {
                        console.log(`Import completed. Added ${inserted}, Updated ${updated} records.`);
                        resolve({ success: true, count: inserted + updated, inserted, updated });
                    }
                });
            }).catch(err => {
                console.error('Error during processing:', err);
                db.run("ROLLBACK");
                reject(err);
            });


        } catch (error) {
            console.error('Error processing Excel file:', error.message);
            reject(error);
        }
    });
};

module.exports = { importHospitals };
