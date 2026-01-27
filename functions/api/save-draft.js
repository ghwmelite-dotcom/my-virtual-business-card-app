// Cloudflare Pages Function - Save Draft to KV
// Saves card drafts for persistent storage across sessions

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

        const { draftId, cardData } = await request.json();

        if (!cardData) {
            return new Response(JSON.stringify({
                error: 'Missing card data'
            }), { status: 400, headers: corsHeaders });
        }

        // Use existing draftId or generate new one
        const id = draftId || generateDraftId();

        const draftRecord = {
            ...cardData,
            draftId: id,
            isDraft: true,
            savedAt: new Date().toISOString(),
            version: 1
        };

        // If updating existing draft, increment version
        if (draftId) {
            const existing = await env.CARDS.get(`draft:${draftId}`);
            if (existing) {
                const existingData = JSON.parse(existing);
                draftRecord.version = (existingData.version || 0) + 1;
                draftRecord.createdAt = existingData.createdAt;
            }
        }

        if (!draftRecord.createdAt) {
            draftRecord.createdAt = new Date().toISOString();
        }

        // Save to KV with 30 day expiration
        await env.CARDS.put(`draft:${id}`, JSON.stringify(draftRecord), {
            expirationTtl: 60 * 60 * 24 * 30 // 30 days
        });

        return new Response(JSON.stringify({
            success: true,
            draftId: id,
            savedAt: draftRecord.savedAt,
            version: draftRecord.version,
            message: 'Draft saved successfully'
        }), { headers: corsHeaders });

    } catch (error) {
        console.error('Save Draft Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to save draft',
            message: error.message
        }), { status: 500, headers: corsHeaders });
    }
}

function generateDraftId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'draft_' + id;
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
