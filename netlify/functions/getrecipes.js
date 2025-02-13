// netlify/functions/getRecipes.js

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

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
                'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
                'anthropic-version': '2024-01-01'
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 1500,
                messages: [
                    {
                        role: "user",
                        content: `Generate 5 diverse recipe suggestions which will be simple to make and tasty based on these ingredients: ${ingredients.join(', ')}. 
                        ${canShop ? "The user can buy additional ingredients if needed." : "Only use the listed ingredients."}
                        Return the response in this exact JSON format:
                        {
                            "recipes": [
                                {
                                    "name": "Recipe Name",
                                    "cuisine": "Cuisine Type",
                                    "ingredients": ["ingredient1", "ingredient2"],
                                    "description": "Brief description",
                                    "instructions": "Cooking instructions",
                                    "imagePrompt": "Detailed prompt for generating a photo of this dish"
                                }
                            ]
                        }`
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API call failed: ${response.status}`);
        }

        const claudeData = await response.json();
        const recipes = JSON.parse(claudeData.content[0].text).recipes;

        // Now generate images using your preferred image generation API
        // For this example, we'll use a placeholder image service
        const recipesWithImages = recipes.map(recipe => ({
            ...recipe,
            imageUrl: `/api/placeholder/800/600` // Replace this with actual image generation
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ recipes: recipesWithImages })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to generate recipes', details: error.message })
        };
    }
};
