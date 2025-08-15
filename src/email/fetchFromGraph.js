// src/email/fetchFromGraph.js
const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');
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

  // Now you're ready to call Microsoft Graph, for example:
  const messages = await client
    .api('/users/' + process.env.GRAPH_USER + '/mailFolders/Inbox/messages')
    .top(10)
    .get();

  console.log('Fetched messages:', messages);
  return [];
}

module.exports = fetchEmailAttachments;