const { getVendorFromAccountNumber } = require('../utils/getVendorFromAccountNumber');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const VERYFI_API_URL = 'https://api.veryfi.com/api/v8/partner/documents';

const config = {
  client_id: process.env.VERYFI_CLIENT_ID,
  client_secret: process.env.VERYFI_CLIENT_SECRET,
  username: process.env.VERYFI_USERNAME,
  api_key: process.env.VERYFI_API_KEY
};

async function parseWithVeryfi(pdfPath) {
  const fileBuffer = fs.readFileSync(pdfPath);
  const fileName = path.basename(pdfPath);

  const base64file = fileBuffer.toString('base64');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'CLIENT-ID': config.client_id,
    'AUTHORIZATION': `apikey ${config.username}:${config.api_key}`
  };

  const payload = {
    file_name: fileName,
    file_data: base64file,
    categories: ['Accounting'],
    auto_delete: true
  };

  try {
    const response = await axios.post(VERYFI_API_URL, payload, { headers });
    // console.log('📦 Veryfi Extracted Data:\n', JSON.stringify(response.data, null, 2));
    const accountNumber = response.data.account_number;
    const vendorInfo = await getVendorFromAccountNumber(accountNumber);

    // Extract PO Numbers from OCR text
    const poNumbersFromOCR = [];
    if (response.data.ocr_text) {
      const lines = response.data.ocr_text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (/PO Number[:\s]/i.test(lines[i])) {
          const match = lines[i].match(/PO Number[:\s]*([A-Z0-9\-]+)/i);
          if (match && match[1]) {
            poNumbersFromOCR.push(match[1]);
          }
        }
      }
    }

    const invoiceData = {
      vendorID: vendorInfo?.vendorID || null,
      companyName: vendorInfo?.companyName || null,
      accountNumber,
      invoiceNumber: response.data.invoice_number,
      invoiceDate: response.data.date ? response.data.date.split(' ')[0] : null,
      dueDate: response.data.due_date || null,
      dateReceived: new Date().toISOString().split('T')[0],
      postingDate: new Date().toISOString().split('T')[0],
      apAccountNumber: '2000',
      poNumber: response.data.purchase_order_number || null,
      totalAmount: response.data.total || 0,
      lineItems: response.data.line_items?.map((item, index) => {
        let poNumber = null;
        if (item.text) {
          const poMatch = item.text.match(/PO Number[:\s]*([A-Z0-9\-]+)/i);
          if (poMatch && poMatch[1]) {
            poNumber = poMatch[1];
          }
        }
        if (!poNumber && poNumbersFromOCR[index]) {
          poNumber = poNumbersFromOCR[index];
        }
        return {
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.price,
          poNumber
        };
      }) || []
    };
    console.log('🧾 Parsed Invoice Data:', JSON.stringify(invoiceData, null, 2));
    return invoiceData;
  } catch (err) {
    console.error('❌ Veryfi API Error:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = parseWithVeryfi;