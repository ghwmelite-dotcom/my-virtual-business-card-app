// Cloudflare Pages Function - AI Tagline Generator
// Uses Workers AI with Llama 3.1 model

export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { jobTitle, industry, tone = 'professional' } = await request.json();

        if (!jobTitle || !industry) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: jobTitle and industry'
            }), { status: 400, headers: corsHeaders });
        }

        const toneDescriptions = {
            professional: 'formal, authoritative, and business-focused',
            creative: 'innovative, unique, and imaginative',
            casual: 'friendly, approachable, and conversational'
        };

        const toneDesc = toneDescriptions[tone] || toneDescriptions.professional;

        const prompt = `You are a professional branding expert. Generate exactly 4 unique, compelling professional taglines for a ${jobTitle} working in the ${industry} industry.

Requirements:
- Each tagline should be ${toneDesc}
- Keep each tagline under 60 characters
- Make them memorable and impactful
- Focus on value proposition and expertise
- Do NOT use generic phrases like "Passionate about" or "Dedicated to"

Format: Return ONLY the 4 taglines, one per line, without numbering or bullet points.`;

        const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                { role: 'system', content: 'You are a concise professional branding expert. Return only what is asked, no explanations.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 256,
            temperature: 0.7
        });

        // Parse the response into individual taglines
        const taglines = response.response
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && line.length < 100)
            .slice(0, 4);

        return new Response(JSON.stringify({
            success: true,
            taglines,
            model: '@cf/meta/llama-3.1-8b-instruct'
        }), { headers: corsHeaders });

    } catch (error) {
        console.error('AI Tagline Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to generate taglines',
            message: error.message
        }), { status: 500, headers: corsHeaders });
    }
}

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
