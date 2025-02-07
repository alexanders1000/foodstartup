// netlify/functions/getRecipes.js

const { Configuration, OpenAIApi } = require('openai');

exports.handler = async function(event, context) {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { ingredients, canShop } = JSON.parse(event.body);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 1000,
                messages: [
                    {
                        role: "user",
                        content: `Generate 5 diverse recipe suggestions based on these ingredients: ${ingredients.join(', ')}. 
                        ${canShop ? "The user can buy additional ingredients if needed." : "Only use the listed ingredients."}
                        Return the response in this exact JSON format:
                        {
                            "recipes": [
                                {
                                    "name": "Recipe Name",
                                    "cuisine": "Cuisine Type",
                                    "ingredients": ["ingredient1", "ingredient2"],
                                    "description": "Brief description",
                                    "instructions": "Cooking instructions"
                                }
                            ]
                        }`
                    }
                ]
            })
        });

        const data = await response.json();
        const recipes = JSON.parse(data.content[0].text).recipes;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ recipes })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to generate recipes' })
        };
    }
};
