const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csvParse = require('csv-parse/sync');
const { PDFExtract } = require('pdf.js-extract');

module.exports = async function parseInvoice(filePath) {
  const pdfExtract = new PDFExtract();
  const data = await pdfExtract.extract(filePath, {});
  console.log('📊 Full Structured PDF Data:\n', JSON.stringify(data, null, 2));

  const text = data.pages.map(page =>
    page.content.map(item => item.str).join(' ')
  ).join('\n');

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  // console.log('📝 Extracted PDF Texts:\n', text);

  const GOOGLE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRByDPNTTT_AISpPA6oqwZflAamXUkeJsvcqkP75lbjp1K9hM5-Yf_m6c-WFy2Lg8Cg5f8oPcbrOMg/pub?output=csv';

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

  const vendorMap = await getVendorMapFromGoogleSheet();

  let accountNumber = null;
  for (const acct of Object.keys(vendorMap)) {
    if (text.includes(acct)) {
      accountNumber = acct;
      break;
    }
  }

  if (!accountNumber) {
    throw new Error('Could not identify vendor from account number in text.');
  }

  const { vendorID, companyName } = vendorMap[accountNumber];

  let invoiceNumber = null;
  let invoiceDate = null;

  if (vendorID === 'ABZ') {
    // Use hardcoded coordinates for known layout of this vendor
    const page = data.pages[0]; // assuming it's always on the first page
    const match = page.content.find(item =>
      item.x === 478.2 &&
      item.y === 188.70000000000005 &&
      item.str.match(/^\d+$/)
    );
    if (match) {
      invoiceNumber = match.str;
      console.log('📍 Invoice number extracted by position for vendor ABZ:', invoiceNumber);
      // Extract invoice date by fixed coordinates
      const dateMatch = page.content.find(item =>
        item.x === 478.20000000000005 &&
        item.y === 204.70000000000005 &&
        item.str.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
      );
      if (dateMatch) {
        invoiceDate = dateMatch.str;
        console.log('📍 Invoice date extracted by position for vendor ABZ:', invoiceDate);
      }
    }
  }

  const invoiceData = {
    vendorID,
    invoiceNumber: '', // to be filled above
    invoiceDate: invoiceDate || '2025-08-15',
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

  invoiceData.invoiceNumber = invoiceNumber || `INV-${accountNumber}`;

  console.log('🔍 Extracted Invoice Data:\n', JSON.stringify(invoiceData, null, 2));
  return invoiceData;
};