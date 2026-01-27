// Handle meeting scheduling requests

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { cardId, requesterName, requesterEmail, preferredDate, preferredTime, message } = await request.json();

        if (!cardId || !requesterEmail) {
            return new Response(JSON.stringify({
                error: 'Card ID and email required'
            }), { status: 400, headers: corsHeaders });
        }

        const meetingRequest = {
            cardId,
            requesterName: requesterName || 'Anonymous',
            requesterEmail,
            preferredDate,
            preferredTime,
            message: message || '',
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        // Store meeting request
        const meetingKey = `meeting:${cardId}:${Date.now()}`;
        await env.CARDS.put(meetingKey, JSON.stringify(meetingRequest));

        return new Response(JSON.stringify({
            success: true,
            message: 'Meeting request submitted successfully'
        }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to schedule meeting',
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
