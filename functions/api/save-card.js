// Save card to KV for persistent URLs

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const cardData = await request.json();

        // Generate unique ID or use existing
        const cardId = cardData.id || crypto.randomUUID().slice(0, 8);

        // Save to KV
        await env.CARDS.put(`card:${cardId}`, JSON.stringify({
            ...cardData,
            id: cardId,
            updatedAt: new Date().toISOString(),
            createdAt: cardData.createdAt || new Date().toISOString()
        }));

        return new Response(JSON.stringify({
            success: true,
            cardId,
            url: `https://cardcraft.pages.dev/c/${cardId}`
        }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to save card',
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
