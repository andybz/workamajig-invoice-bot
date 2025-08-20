# Workamajig Invoice Bot

Automated pipeline to extract PDF invoice data and post to Workamajig API.

There is a ENV file that houses the API keys and IMAP/SMTP credentials that is required. 

## Functionality Overview
1. Checks a specific email address inbox for new emails that have a PDF attached
2. Parses that invoice PDF via Veryfi.com API
3. Sends to Workamajig via their API
4. Creates a new vendor invoice 
5. Notifies client that a new invoice has been created

## Email Stuff
- Utilizes Microsoft Azure with Microsoft Graph
- The Client Secret will expire after 24 months and you will need to generate a new one. (Last generated on 8/15/25)
- Go to Azure Portal -> [App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) to find this information