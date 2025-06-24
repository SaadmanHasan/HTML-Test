// netlify/functions/analyzeImage.js

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { imageUrl } = JSON.parse(event.body);
    const LOGMEAL_USER_ID = process.env.LOGMEAL_USER_ID;
    const LOGMEAL_API_KEY = process.env.LOGMEAL_API_KEY;
    const LOGMEAL_INGREDIENT_API_URL = 'https://logmeal.com/api/recognition/ingredient-recognition';

    if (!imageUrl) {
      return { statusCode: 400, body: 'Missing imageUrl in request body' };
    }

    const logmealPayload = {
      "url": imageUrl,
      "user_id": LOGMEAL_USER_ID,
      "api_key": LOGMEAL_API_KEY
    };

    const response = await fetch(LOGMEAL_INGREDIENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logmealPayload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `LogMeal API error: ${errorBody}` })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Internal Server Error: ${error.message}` })
    };
  }
};
