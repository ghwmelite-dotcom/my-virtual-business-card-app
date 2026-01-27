// Cloudflare Pages Function - Load Draft from KV

export async function onRequestGet(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        if (!env.CARDS) {
            return new Response(JSON.stringify({
                error: 'Storage not configured'
            }), { status: 500, headers: corsHeaders });
        }

        const url = new URL(request.url);
        const draftId = url.searchParams.get('id');

        if (!draftId) {
            return new Response(JSON.stringify({
                error: 'Missing draft ID'
            }), { status: 400, headers: corsHeaders });
        }

        const draftData = await env.CARDS.get(`draft:${draftId}`);

        if (!draftData) {
            return new Response(JSON.stringify({
                error: 'Draft not found',
                message: 'This draft may have expired or does not exist'
            }), { status: 404, headers: corsHeaders });
        }

        const draft = JSON.parse(draftData);

        return new Response(JSON.stringify({
            success: true,
            draft,
            message: 'Draft loaded successfully'
        }), { headers: corsHeaders });

    } catch (error) {
        console.error('Load Draft Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to load draft',
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
