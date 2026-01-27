// Get analytics for a card

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

        // Get total views
        const totalViews = parseInt(await env.CARDS.get(`count:${cardId}`) || '0');

        // Get recent views (last 100)
        const viewsList = await env.CARDS.list({ prefix: `view:${cardId}:`, limit: 100 });

        const recentViews = [];
        const countries = {};
        const actions = { view: 0, email_click: 0, phone_click: 0, website_click: 0, social_click: 0 };
        const dailyViews = {};

        for (const key of viewsList.keys) {
            const viewData = await env.CARDS.get(key.name);
            if (viewData) {
                const view = JSON.parse(viewData);
                recentViews.push(view);

                // Count by country
                countries[view.country] = (countries[view.country] || 0) + 1;

                // Count by action
                if (actions[view.action] !== undefined) {
                    actions[view.action]++;
                }

                // Count by day
                const day = view.timestamp.split('T')[0];
                dailyViews[day] = (dailyViews[day] || 0) + 1;
            }
        }

        // Sort recent views by timestamp
        recentViews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return new Response(JSON.stringify({
            success: true,
            analytics: {
                totalViews,
                recentViews: recentViews.slice(0, 20),
                countries,
                actions,
                dailyViews
            }
        }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to get analytics',
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
