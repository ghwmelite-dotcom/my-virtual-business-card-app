// Register a contact for follow-up

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { cardId, name, email, message } = await request.json();

        if (!cardId || !email) {
            return new Response(JSON.stringify({
                error: 'Card ID and email required'
            }), { status: 400, headers: corsHeaders });
        }

        const contactData = {
            cardId,
            name: name || 'Anonymous',
            email,
            message: message || '',
            timestamp: new Date().toISOString(),
            followUpSent: false
        };

        // Store contact
        const contactKey = `contact:${cardId}:${Date.now()}`;
        await env.CARDS.put(contactKey, JSON.stringify(contactData));

        // Update contact count
        const countKey = `contacts:${cardId}`;
        const currentCount = parseInt(await env.CARDS.get(countKey) || '0');
        await env.CARDS.put(countKey, String(currentCount + 1));

        return new Response(JSON.stringify({
            success: true,
            message: 'Contact registered successfully'
        }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to register contact',
            message: error.message
        }), { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
