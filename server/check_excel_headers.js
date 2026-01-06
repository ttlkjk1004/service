const xlsx = require('xlsx');
const path = require('path');

const filename = path.join(__dirname, 'Hospital_data.xlsx');
try {
    const workbook = xlsx.readFile(filename);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length > 0) {
        console.log('Headers:', data[0]);
        console.log('First Row Data:', data[1]);
    } else {
        console.log('File is empty or could not be read.');
    }
} catch (error) {
    console.error('Error reading file:', error.message);
}
