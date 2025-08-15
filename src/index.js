require('dotenv').config();
const checkInbox = require('./email/checkInbox');
const parseInvoice = require('./pdf/parseInvoice');
const sendToWorkamajig = require('./api/workamajigClient');
const sendEmail = require('./notify/sendEmail');

async function main() {
  console.log('⏳ Checking inbox for new invoices...');
  const files = await checkInbox();

  if (!files || files.length === 0) {
    console.log('📭 No new PDF invoices found.');
    return;
  }

  for (const file of files) {
    console.log(`📄 Parsing: ${file}`);
    const invoice = await parseInvoice(file);
    console.log('🧾 Parsed invoice:', invoice);

    const result = await sendToWorkamajig(invoice);
    console.log('✅ Invoice submitted:', result);

    await sendEmail(invoice, result);
    console.log('📬 Confirmation email sent.\n');
  }
}
main().catch(console.error);
