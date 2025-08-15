const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TEMP_DIR = path.resolve(__dirname, '../../test-invoices');

module.exports = function checkInbox() {
  return new Promise((resolve, reject) => {
  const imap = new Imap({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '993'),
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  });

    const savedFiles = [];

    function openInbox(cb) {
      imap.openBox('INBOX', false, cb);
    }

    imap.once('ready', () => {
      console.log('🔐 Connected to inbox as:', process.env.EMAIL_USER);
      openInbox((err, box) => {
        if (err) return reject(err);

        imap.search(['UNSEEN'], (err, results) => {
          if (err || !results.length) {
            console.log('📭 No new emails found.');
            imap.end();
            return resolve(savedFiles);
          }

          const f = imap.fetch(results, { bodies: '', struct: true });

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) return console.error('❌ Error parsing email:', err);
                if (parsed.attachments && parsed.attachments.length) {
                  for (const att of parsed.attachments) {
                    if (att.contentType === 'application/pdf') {
                      const filePath = path.join(TEMP_DIR, `${Date.now()}-${att.filename}`);
                      fs.writeFileSync(filePath, att.content);
                      savedFiles.push(filePath);
                      console.log(`📥 Saved PDF: ${filePath}`);
                    }
                  }
                }
              });
            });
          });

          f.once('end', () => {
            console.log('✅ Done processing emails.');
            imap.end();
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP error:', err);
      reject(err);
    });

    imap.once('end', () => {
      console.log('📤 IMAP connection closed');
      resolve(savedFiles);
    });

    imap.connect();
  });
};