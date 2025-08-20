// Remove this line:
// const fetch = require('node-fetch');

// Replace with native fetch (no need to import if using Node.js v18+)
const { parse } = require('csv-parse/sync');
require('dotenv').config();

const csvUrl = process.env.VENDOR_CSV_URL;

async function getVendorFromAccountNumber(accountNumber) {
  if (!csvUrl) throw new Error('VENDOR_CSV_URL not set in environment');

  const response = await fetch(csvUrl); // native fetch
  if (!response.ok) throw new Error(`Failed to fetch vendor CSV: ${response.statusText}`);
  const csvText = await response.text();

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true
  });

  const match = records.find(
    (row) => row.accountNumber?.trim() === accountNumber?.trim()
  );

  if (!match) return null;

  return {
    vendorID: match.vendorID,
    companyName: match.companyName,
    accountNumber: match.accountNumber
  };
}

module.exports = { getVendorFromAccountNumber };