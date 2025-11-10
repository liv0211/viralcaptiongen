// netlify/functions/generate-caption.js
// Using SiliconFlow API for caption generation

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { topic, platform, style, length } = JSON.parse(event.body);

    // Validate inputs
    if (!topic || !platform || !style || !length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Define style and platform guides
    const lengthGuide = {
      'short': '1-2 sentences',
      'medium': '3-5 sentences',
      'long': '6-8 sentences'
    };

    const styleGuide = {
      'casual': 'friendly and conversational',
      'professional': 'polished and business-appropriate',
      'funny': 'humorous and entertaining',
      'inspirational': 'motivational and uplifting',
      'engaging': 'attention-grabbing with questions or calls-to-action'
    };

    const platformGuide = {
      'instagram': 'Include relevant hashtags and emojis. Encourage engagement.',
      'youtube': 'Focus on video description style with hooks. Can include timestamp format.',
      'twitter': 'Keep it concise and impactful. Consider character limits.',
      'facebook': 'Conversational and community-focused.',
      'linkedin': 'Professional tone with industry insights.',
      'tiktok': 'Trendy, short, and hook-driven with popular hashtags.'
    };

    // Construct the AI prompt
    const prompt = `Generate 5 different social media captions about: "${topic}"

Requirements:
- Platform: ${platform} - ${platformGuide[platform]}
- Style: ${styleGuide[style]}
- Length: ${lengthGuide[length]}
- Make each caption unique and engaging
- Include appropriate emojis and hashtags where suitable
- Each caption should be ready to post
- Write in natural, native English

Provide 5 distinct captions, separated by "---"`;

    // Call SiliconFlow API (OpenAI-compatible endpoint)
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',  // You can change to other models
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.8,
        max_tokens: 1000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SiliconFlow API error:', errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'Failed to generate captions',
          details: errorData 
        })
      };
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Split the response into individual captions
    const captions = generatedText.split('---')
      .map(caption => caption.trim())
      .filter(caption => caption.length > 0)
      .slice(0, 5);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        captions,
        success: true 
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
