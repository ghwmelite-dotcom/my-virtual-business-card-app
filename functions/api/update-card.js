// Cloudflare Pages Function - Update Card in KV

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        if (!env.CARDS) {
            return new Response(JSON.stringify({
                error: 'Storage not configured'
            }), { status: 500, headers: corsHeaders });
        }

        const { cardId, cardData } = await request.json();

        if (!cardId || !cardData?.fullName) {
            return new Response(JSON.stringify({
                error: 'Missing required fields'
            }), { status: 400, headers: corsHeaders });
        }

        const existingData = await env.CARDS.get(cardId);

        if (!existingData) {
            return new Response(JSON.stringify({
                error: 'Card not found'
            }), { status: 404, headers: corsHeaders });
        }

        const existingCard = JSON.parse(existingData);

        const updatedCard = {
            ...cardData,
            id: cardId,
            createdAt: existingCard.createdAt,
            updatedAt: new Date().toISOString(),
            version: (existingCard.version || 1) + 1
        };

        await env.CARDS.put(cardId, JSON.stringify(updatedCard), {
            expirationTtl: 31536000
        });

        const url = new URL(request.url);
        const permanentUrl = `${url.protocol}//${url.host}/c/${cardId}`;

        return new Response(JSON.stringify({
            success: true,
            cardId,
            permanentUrl,
            updatedAt: updatedCard.updatedAt,
            version: updatedCard.version
        }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to update card',
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
