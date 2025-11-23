const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, 'sa38-webmaster.xlsx'));

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON with header option
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Raw data first 5 rows:');
console.log(JSON.stringify(rawData.slice(0, 5), null, 2));

// Find header row and map columns
let headerRowIndex = 0;
for (let i = 0; i < rawData.length; i++) {
  const row = rawData[i];
  if (row && row.some(cell => cell === 'PERNR' || String(cell).includes('PERNR'))) {
    headerRowIndex = i;
    break;
  }
}

console.log('Header row index:', headerRowIndex);

// Map to proper column names (data starts at column index 1)
const headers = ['PERNR', 'ENAME', 'STELL', 'PERSK', 'ORGEHID', 'ORGEH', 'PARENTORGID', 'PARENTORG', 'MGRPERNR'];
const data = rawData.slice(headerRowIndex + 1).map(row => {
  if (!row || row.length < 2) return null;
  const obj = {};
  headers.forEach((header, index) => {
    // Data starts at column 1 (index 1), not 0
    obj[header] = row[index + 1] !== undefined ? row[index + 1] : null;
  });
  return obj;
}).filter(emp => emp && emp.PERNR !== null && emp.PERNR !== undefined && typeof emp.PERNR === 'number');

console.log('Total employees:', data.length);
console.log('Sample data (first 3 rows):');
console.log(JSON.stringify(data.slice(0, 3), null, 2));

// Get column names
if (data.length > 0) {
  console.log('\nColumn names:');
  console.log(Object.keys(data[0]));
}

// Save to JSON file
const outputPath = path.join(__dirname, 'employees.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`\nData saved to: ${outputPath}`);

// Analyze data
const levels = {};
data.forEach(emp => {
  const level = emp.PERSK || 'Unknown';
  levels[level] = (levels[level] || 0) + 1;
});

console.log('\nEmployee distribution by PERSK:');
Object.keys(levels).sort((a, b) => a - b).forEach(level => {
  console.log(`  Level ${level}: ${levels[level]} employees`);
});
