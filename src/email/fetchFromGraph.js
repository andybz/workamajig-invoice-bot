// src/email/fetchFromGraph.js
const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');
const fs = require('fs');
const path = require('path');
require('isomorphic-fetch');

const credential = new ClientSecretCredential(
  process.env.GRAPH_TENANT_ID,
  process.env.GRAPH_CLIENT_ID,
  process.env.GRAPH_CLIENT_SECRET
);

async function getAccessToken() {
  const scope = 'https://graph.microsoft.com/.default';
  const tokenResponse = await credential.getToken(scope);
  return tokenResponse.token;
}

async function fetchEmailAttachments() {
  const token = await getAccessToken();

  const client = Client.init({
    authProvider: (done) => {
      done(null, token); // Pass the token to the Graph client
    },
  });

  const messages = await client
    .api('/users/' + process.env.GRAPH_USER + '/mailFolders/Inbox/messages')
    .top(10)
    .select('id,subject,hasAttachments')
    .orderby('receivedDateTime DESC')
    .get();

  const downloadDir = path.join(__dirname, '../../downloads');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }

  const savedFiles = [];

  for (const message of messages.value) {
    if (message.hasAttachments) {
      const attachments = await client
        .api(`/users/${process.env.GRAPH_USER}/messages/${message.id}/attachments`)
        .get();

      for (const attachment of attachments.value) {
        if (
          attachment.contentType === 'application/pdf' &&
          attachment.contentBytes &&
          attachment.name
        ) {
          const buffer = Buffer.from(attachment.contentBytes, 'base64');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `${timestamp}-${attachment.name}`;
          const filePath = path.join(downloadDir, fileName);
          fs.writeFileSync(filePath, buffer);
          console.log(`✅ Saved PDF: ${attachment.name}`);
          savedFiles.push(filePath);
        }
      }
      await client.api(`/users/${process.env.GRAPH_USER}/messages/${message.id}`).update({
        isRead: true,
      });
    }
  }

  if (savedFiles.length === 0) {
    console.log('📭 No new PDF invoices found.');
  }

  return savedFiles;
}

module.exports = fetchEmailAttachments;