// Track card views for analytics

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { cardId, action = 'view' } = await request.json();

        if (!cardId) {
            return new Response(JSON.stringify({
                error: 'Card ID required'
            }), { status: 400, headers: corsHeaders });
        }

        // Get visitor info from Cloudflare headers
        const cf = request.cf || {};
        const viewData = {
            cardId,
            action,
            timestamp: new Date().toISOString(),
            country: cf.country || 'Unknown',
            city: cf.city || 'Unknown',
            device: request.headers.get('user-agent') || 'Unknown',
            referrer: request.headers.get('referer') || 'Direct'
        };

        // Store in KV with timestamp-based key
        const viewKey = `view:${cardId}:${Date.now()}`;
        await env.CARDS.put(viewKey, JSON.stringify(viewData), {
            expirationTtl: 60 * 60 * 24 * 90 // 90 days
        });

        // Update view count
        const countKey = `count:${cardId}`;
        const currentCount = parseInt(await env.CARDS.get(countKey) || '0');
        await env.CARDS.put(countKey, String(currentCount + 1));

        return new Response(JSON.stringify({
            success: true,
            views: currentCount + 1
        }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to track view',
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
