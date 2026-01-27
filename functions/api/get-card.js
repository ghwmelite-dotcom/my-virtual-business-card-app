// Get card from KV by ID

export async function onRequestGet(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const url = new URL(request.url);
        const cardId = url.searchParams.get('id');

        if (!cardId) {
            return new Response(JSON.stringify({
                error: 'Card ID required'
            }), { status: 400, headers: corsHeaders });
        }

        const cardData = await env.CARDS.get(`card:${cardId}`);

        if (!cardData) {
            return new Response(JSON.stringify({
                error: 'Card not found'
            }), { status: 404, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
            success: true,
            card: JSON.parse(cardData)
        }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to get card',
            message: error.message
        }), { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
