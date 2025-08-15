# Workamajig Invoice Bot

Automated pipeline to extract PDF invoice data and post to Workamajig API.

There is a ENV file that houses the API keys and IMAP/SMTP credentials that is required. 

## Functionality Overview
1. Checks an email address inbox for new invoices that have been attached in a message
2. Parses that invoice PDF 
3. Pulls data and sends to workamajig
4. Creates a new vendor invoice 
5. Notifies client that a new invoice has been created