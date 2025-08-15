require('dotenv').config();
const checkInbox = require('./email/checkInbox');
const parseInvoice = require('./pdf/parseInvoice');
const sendToWorkamajig = require('./api/workamajigClient');
const sendEmail = require('./notify/sendEmail');

async function main() {
  const files = await checkInbox(); // Downloads PDFs
  for (const file of files) {
    const invoice = await parseInvoice(file);
    const result = await sendToWorkamajig(invoice);
    await sendEmail(invoice, result);
  }
}
main().catch(console.error);
