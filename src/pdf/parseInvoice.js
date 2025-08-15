const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const axios = require('axios');
const csvParse = require('csv-parse/sync');

const GOOGLE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJm1csq2KvA3zSnfIh6sKtUgxT5y95DeWDc3-VZyrAF5ViI-MsUqMcSmfrIYxZ6CTaFvDEYO0NpuDh/pub?output=csv';

async function getVendorMapFromGoogleSheet() {
  try {
    const response = await axios.get(GOOGLE_CSV_URL);
    const records = csvParse.parse(response.data, {
      columns: true,
      skip_empty_lines: true
    });

    const vendorMap = {};
    for (const row of records) {
      const acct = row.accountNumber?.trim();
      if (acct) {
        vendorMap[acct] = {
          vendorID: row.vendorID?.trim(),
          companyName: row.companyName?.trim()
        };
      }
    }

    return vendorMap;
  } catch (err) {
    console.error('Failed to load vendor CSV from Google:', err.message);
    return {};
  }
}

module.exports = async function parseInvoice(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  const text = data.text;

  const vendorMap = await getVendorMapFromGoogleSheet();
  const acctMatch = text.match(/Account\s*Number[:\s]*([0-9]+)/i);
  const accountNumber = acctMatch ? acctMatch[1] : null;

  if (!accountNumber || !vendorMap[accountNumber]) {
    throw new Error(`Could not identify vendor from account number: ${accountNumber}`);
  }

  const { vendorID, companyName } = vendorMap[accountNumber];

  const invoiceData = {
    vendorID,
    invoiceNumber: `INV-${accountNumber}`, // TEMP
    invoiceDate: '2025-08-15',        // TEMP
    dueDate: '2025-09-15',            // TEMP
    dateReceived: '2025-08-15',       // TEMP
    postingDate: '2025-08-15',        // TEMP
    apAccountNumber: '2000',
    poNumber: accountNumber,
    totalAmount: 100,
    lineItems: [
      {
        description: 'Test Line Item',
        quantity: 1,
        unitPrice: 100
      }
    ]
  };

  return invoiceData;
};