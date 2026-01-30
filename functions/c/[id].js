// Cloudflare Pages Function - Serve Card by ID
// Redirects to main app with card data loaded

export async function onRequestGet(context) {
    const { params, env, request } = context;

    try {
        const cardId = params.id;

        if (!cardId) {
            return Response.redirect(new URL('/', request.url).toString(), 302);
        }

        if (!env.CARDS) {
            return new Response('Storage not configured', { status: 500 });
        }

        const cardData = await env.CARDS.get(`card:${cardId}`);

        if (!cardData) {
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Card Not Found - CardCraft</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #FAF9F7; }
                        .container { text-align: center; padding: 40px; }
                        h1 { color: #1A1A1A; font-size: 2rem; margin-bottom: 1rem; }
                        p { color: #666; margin-bottom: 2rem; }
                        a { color: #B87333; text-decoration: none; font-weight: 500; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Card Not Found</h1>
                        <p>This card may have been deleted or the link is incorrect.</p>
                        <a href="/">Create your own card</a>
                    </div>
                </body>
                </html>
            `, {
                status: 404,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        const card = JSON.parse(cardData);
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;

        // Track view
        try {
            const analyticsKey = `analytics:${cardId}`;
            const analyticsData = await env.CARDS.get(analyticsKey);
            const analytics = analyticsData ? JSON.parse(analyticsData) : { views: 0, qrScans: 0, linkClicks: 0, contactSaves: 0 };
            analytics.views++;
            analytics.lastViewed = new Date().toISOString();
            await env.CARDS.put(analyticsKey, JSON.stringify(analytics));
        } catch (e) {
            console.error('Analytics tracking error:', e);
        }

        // Redirect to main app with card ID in query param
        return Response.redirect(`${baseUrl}/?view=${cardId}`, 302);

    } catch (error) {
        console.error('Card View Error:', error);
        return new Response('Error loading card', { status: 500 });
    }
}
