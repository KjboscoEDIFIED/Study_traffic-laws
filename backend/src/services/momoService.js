const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const MOMO_BASE_URL = process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
const SUBSCRIPTION_KEY = process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY;
const API_USER_ID = process.env.MOMO_API_USER_ID;
const API_KEY = process.env.MOMO_API_KEY;
const ENVIRONMENT = process.env.MOMO_ENVIRONMENT || 'sandbox';
const CURRENCY = process.env.MOMO_CURRENCY || 'RWF';

// Get Bearer Access Token
const getAccessToken = async () => {
  const credentials = Buffer.from(`${API_USER_ID}:${API_KEY}`).toString('base64');
  const response = await axios.post(
    `${MOMO_BASE_URL}/collection/token/`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      },
    }
  );
  return response.data.access_token;
};

// Request to Pay (Collections)
const requestToPay = async ({ amount, phone, externalId, payerMessage = 'Traffic Exam Payment', payeeNote = 'Exam Fee 100 RWF' }) => {
  const referenceId = uuidv4();
  const token = await getAccessToken();

  // Normalize phone: remove leading 0 or +250 and ensure 250 prefix
  let normalizedPhone = phone.replace(/\s+/g, '');
  if (normalizedPhone.startsWith('+')) normalizedPhone = normalizedPhone.substring(1);
  if (normalizedPhone.startsWith('0')) normalizedPhone = '250' + normalizedPhone.substring(1);
  if (!normalizedPhone.startsWith('250')) normalizedPhone = '250' + normalizedPhone;

  await axios.post(
    `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
    {
      amount: String(amount),
      currency: ENVIRONMENT === 'sandbox' ? 'EUR' : CURRENCY, // sandbox uses EUR
      externalId: externalId || uuidv4(),
      payer: {
        partyIdType: 'MSISDN',
        partyId: normalizedPhone,
      },
      payerMessage,
      payeeNote,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
        //...(process.env.MOMO_CALLBACK_URL && {
          //'X-Callback-Url': process.env.MOMO_CALLBACK_URL,
        //}),
      },
    }
  );

  return { referenceId };
};

// Check Payment Status
const getPaymentStatus = async (referenceId) => {
  const token = await getAccessToken();
  const response = await axios.get(
    `${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Target-Environment': ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      },
    }
  );
  return response.data; // { status: 'SUCCESSFUL' | 'FAILED' | 'PENDING', ... }
};

module.exports = { requestToPay, getPaymentStatus };
