// Cloudflare Pages Function - AI Bio Generator
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
        const { name, title, company, tone = 'professional' } = await request.json();

        if (!name || !title) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: name and title'
            }), { status: 400, headers: corsHeaders });
        }

        const toneDescriptions = {
            professional: 'formal and business-focused',
            creative: 'innovative and engaging',
            casual: 'friendly and approachable'
        };

        const toneDesc = toneDescriptions[tone] || toneDescriptions.professional;

        const companyContext = company ? ` at ${company}` : '';

        const prompt = `Write a ${toneDesc} professional bio for ${name} who is a ${title}${companyContext}.

Requirements:
- Keep it to 2-3 sentences (max 150 words)
- Highlight expertise and value
- Make it compelling for a business card or LinkedIn
- Third person voice
- No placeholder text or brackets

Return ONLY the bio text, nothing else.`;

        const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                { role: 'system', content: 'You are a professional copywriter specializing in personal branding. Write concise, impactful bios.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 200,
            temperature: 0.7
        });

        const bio = response.response.trim();

        return new Response(JSON.stringify({
            success: true,
            bio,
            model: '@cf/meta/llama-3.1-8b-instruct'
        }), { headers: corsHeaders });

    } catch (error) {
        console.error('AI Bio Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to generate bio',
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
