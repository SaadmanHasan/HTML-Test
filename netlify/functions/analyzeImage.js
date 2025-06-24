// netlify/functions/analyzeImage.js
const fetch = require('node-fetch'); // Make sure node-fetch is available if not built-in for your Node.js version

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        console.warn(`Method Not Allowed: Received ${event.httpMethod} request.`);
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { imageUrl } = JSON.parse(event.body);
        const LOGMEAL_API_KEY = process.env.LOGMEAL_API_KEY;

        // Verify that imageUrl and API Key are present
        if (!imageUrl) {
            console.error('Missing imageUrl in request body.');
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing imageUrl in request body' }) };
        }
        if (!LOGMEAL_API_KEY) {
            console.error('LOGMEAL_API_KEY environment variable is not set.');
            return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error: LogMeal API Key is missing.' }) };
        }

        // IMPORTANT: Verify this URL with LogMeal's official documentation.
        // This is a commonly used endpoint, but it might vary based on your specific plan/version.
        // If you specifically want *only* ingredients, a URL like:
        // 'https://api.logmeal.com/v2/nutrition/recipe/ingredients/v1.0' might be more accurate.
        // Choose the one that fits your LogMeal plan and documentation.
        const LOGMEAL_API_URL = 'https://api.logmeal.com/v2/image/recognition/complete';

        // Prepare the payload for LogMeal API
        // LogMeal usually expects the image URL in the body, and API key in headers.
        const logmealPayload = {
            "url": imageUrl,
            "lang": "en" // You might want to make this configurable or based on user preference
        };

        console.log(`Attempting to fetch LogMeal API: ${LOGMEAL_API_URL}`);
        console.log('Sending payload:', JSON.stringify(logmealPayload));

        const response = await fetch(LOGMEAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // LogMeal typically uses the API Key in the Authorization header as a Bearer token
                'Authorization': `Bearer ${LOGMEAL_API_KEY}`
            },
            body: JSON.stringify(logmealPayload)
        });

        // Handle non-OK responses from LogMeal API
        if (!response.ok) {
            const errorText = await response.text(); // Get raw text to see what LogMeal actually sent
            console.error(`LogMeal API responded with status ${response.status}: ${errorText}`);
            return {
                statusCode: response.status, // Pass through the LogMeal status code
                body: JSON.stringify({
                    error: `LogMeal API error (Status: ${response.status}): ${errorText.substring(0, 250)}...`
                })
            };
        }

        const data = await response.json();
        console.log('Successfully received data from LogMeal:', data);

        // Return the data received from LogMeal back to the client
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Serverless function execution error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Internal Server Error: ${error.message}` })
        };
    }
};
