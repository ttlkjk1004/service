const xlsx = require('xlsx');
const path = require('path');

const EXCEL_FILENAME = 'hospital_data.xlsx';
try {
    const workbook = xlsx.readFile(path.join(__dirname, EXCEL_FILENAME));
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length > 0) {
        console.log("Headers:", Object.keys(data[0]));
        console.log("First Row:", data[0]);
    } else {
        console.log("Excel file is empty.");
    }
} catch (error) {
    console.error("Error:", error.message);
}
