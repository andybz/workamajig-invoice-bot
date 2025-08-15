const axios = require('axios');
require('dotenv').config();

async function createInvoice(invoiceData) {
  try {
    const response = await axios.post(
      `${process.env.WORKAMAJIG_API_URL}/vouchers`, 
      invoiceData,
      {
        headers: {
          'Content-Type': 'application/json',
          'APIAccessToken': process.env.WORKAMAJIG_API_KEY,
          'UserToken': process.env.WORKAMAJIG_USER_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Workamajig API Error:', error.response?.data || error.message);
    if (error.response?.data) {
  console.error('Workamajig API Error:', JSON.stringify(error.response.data, null, 2));
} else {
  console.error('Workamajig API Error:', error.message);
}
    throw error;
  }
}

module.exports = createInvoice;