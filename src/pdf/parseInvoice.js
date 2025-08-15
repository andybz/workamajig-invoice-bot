const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const PO_VENDOR_MAP = {
  '004720': {
    vendorID: 'PS',
    companyName: 'PrintSmart Inc.'
  }
};

module.exports = async function parseInvoice(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  const text = data.text;

  const poMatch = text.match(/([0-9]{5,})\s*PO\s*Number:/i);
  const poNumber = poMatch ? poMatch[1] : null;

  if (!poNumber || !PO_VENDOR_MAP[poNumber]) {
    throw new Error(`Could not identify vendor from PO number: ${poNumber}`);
  }

  const { vendorID, companyName } = PO_VENDOR_MAP[poNumber];

  const invoiceData = {
    vendorID,
    invoiceNumber: `INV-${poNumber}`, // TEMP
    invoiceDate: '2025-08-15',        // TEMP
    dueDate: '2025-09-15',            // TEMP
    dateReceived: '2025-08-15',       // TEMP
    postingDate: '2025-08-15',        // TEMP
    apAccountNumber: '2000',
    poNumber,
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