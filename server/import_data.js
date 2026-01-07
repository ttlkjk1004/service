const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Configuration
const EXCEL_FILENAME = 'hospital_data.xlsx';

const importHospitals = (db) => {
    return new Promise(async (resolve, reject) => {
        // Helper to Promisify db.run
        const run = (sql, params = []) => {
            return new Promise((res, rej) => {
                db.run(sql, params, function (err) {
                    if (err) rej(err);
                    else res(this);
                });
            });
        };

        // Helper to Promisify db.get
        const get = (sql, params = []) => {
            return new Promise((res, rej) => {
                db.get(sql, params, (err, row) => {
                    if (err) rej(err);
                    else res(row);
                });
            });
        };

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

            // Start Transaction Manually
            await run("BEGIN TRANSACTION");

            let inserted = 0;
            let updated = 0;
            let errorCount = 0;

            try {
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
                        // Check existence
                        const existing = await get("SELECT id FROM hospitals WHERE name = ?", [name]);

                        if (existing) {
                            // Update
                            await run(`UPDATE hospitals SET
                                location = ?, products = ?, system = ?, installation_date = ?, 
                                device_type = ?, serial_number = ?, revision_firmware = ?, software_version = ?
                                WHERE id = ?`, [
                                location, products, system, installationDate,
                                deviceType, serialNumber, revisionFirmware, softwareVersion,
                                existing.id
                            ]);
                            updated++;
                        } else {
                            // Insert
                            await run(`INSERT INTO hospitals (
                                name, location, products, system, installation_date, 
                                device_type, serial_number, revision_firmware, software_version
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                                name, location, products, system, installationDate,
                                deviceType, serialNumber, revisionFirmware, softwareVersion
                            ]);
                            inserted++;
                        }
                    } catch (recordError) {
                        console.error(`Error processing record ${name}:`, recordError.message);
                        errorCount++;
                    }
                }

                // If we get here, everything is good. Commit.
                await run("COMMIT");
                console.log(`Import completed. Added ${inserted}, Updated ${updated} records.`);
                resolve({ success: true, count: inserted + updated, inserted, updated });

            } catch (transactionError) {
                // If main logic fails (unlikely due to inner catch), Rollback
                console.error("Critical error during processing, rolling back.", transactionError);
                await run("ROLLBACK");
                reject(transactionError);
            }

        } catch (fileError) {
            console.error('Error processing Excel file:', fileError.message);
            reject(fileError);
        }
    });
};

module.exports = { importHospitals };
