const axios = require('axios')
const { v4: uuidv4 } = require('uuid')

const SUBSCRIPTION_KEY = '0beac74ad5854010b67e58a19e5eeb50'

const setup = async () => {
    const userId = uuidv4()
    console.log('⏳ Creating API User, please wait...')

    try {
        await axios.post(
            'https://sandbox.momodeveloper.mtn.com/v1_0/apiuser',
            { providerCallbackHost: 'localhost' },
            {
                headers: {
                    'X-Reference-Id': userId,
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
                    'Content-Type': 'application/json',
                },
            }
        )
        console.log('✅ API User created!')
    } catch (e) {
        console.error('❌ Step 1 failed:', e.response?.status, e.response?.data || e.message)
        process.exit(1)
    }

    try {
        const keyRes = await axios.post(
            `https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/${userId}/apikey`,
            {},
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
                },
            }
        )

        console.log('\n============================================')
        console.log('✅ SUCCESS! Copy these into your .env file:')
        console.log('============================================')
        console.log(`MOMO_COLLECTION_SUBSCRIPTION_KEY=${SUBSCRIPTION_KEY}`)
        console.log(`MOMO_API_USER_ID=${userId}`)
        console.log(`MOMO_API_KEY=${keyRes.data.apiKey}`)
        console.log('============================================\n')
        process.exit(0)
    } catch (e) {
        console.error('❌ Step 2 failed:', e.response?.status, e.response?.data || e.message)
        process.exit(1)
    }
}

setup()