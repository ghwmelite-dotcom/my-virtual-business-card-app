// Cloudflare Pages Function - Wallet Pass Generator
// Generates Apple Wallet (.pkpass) and Google Wallet passes for business cards

async function sha1Hash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function crc32(data) {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createZip(files) {
    const encoder = new TextEncoder();
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;

    for (const file of files) {
        const nameBytes = encoder.encode(file.name);
        const dataBytes = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
        const crc = crc32(dataBytes);

        const localHeader = new Uint8Array(30 + nameBytes.length);
        const localView = new DataView(localHeader.buffer);
        localView.setUint32(0, 0x04034b50, true);
        localView.setUint16(4, 20, true);
        localView.setUint32(14, crc, true);
        localView.setUint32(18, dataBytes.length, true);
        localView.setUint32(22, dataBytes.length, true);
        localView.setUint16(26, nameBytes.length, true);
        localHeader.set(nameBytes, 30);

        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const centralView = new DataView(centralHeader.buffer);
        centralView.setUint32(0, 0x02014b50, true);
        centralView.setUint16(4, 20, true);
        centralView.setUint16(6, 20, true);
        centralView.setUint32(16, crc, true);
        centralView.setUint32(20, dataBytes.length, true);
        centralView.setUint32(24, dataBytes.length, true);
        centralView.setUint16(28, nameBytes.length, true);
        centralView.setUint32(42, offset, true);
        centralHeader.set(nameBytes, 46);

        localHeaders.push({ header: localHeader, data: dataBytes });
        centralHeaders.push(centralHeader);
        offset += localHeader.length + dataBytes.length;
    }

    const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(8, files.length, true);
    eocdView.setUint16(10, files.length, true);
    eocdView.setUint32(12, centralDirSize, true);
    eocdView.setUint32(16, offset, true);

    const totalSize = offset + centralDirSize + 22;
    const zipData = new Uint8Array(totalSize);
    let pos = 0;

    for (const item of localHeaders) {
        zipData.set(item.header, pos);
        pos += item.header.length;
        zipData.set(item.data, pos);
        pos += item.data.length;
    }
    for (const header of centralHeaders) {
        zipData.set(header, pos);
        pos += header.length;
    }
    zipData.set(eocd, pos);
    return zipData;
}

async function createPKPass(passJson) {
    const passJsonStr = JSON.stringify(passJson, null, 2);
    const manifest = { 'pass.json': await sha1Hash(passJsonStr) };
    const files = [
        { name: 'pass.json', data: passJsonStr },
        { name: 'manifest.json', data: JSON.stringify(manifest) }
    ];
    return createZip(files);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 184, g: 115, b: 51 };
}

function createApplePassJson(cardData, cardUrl) {
    const rgb = hexToRgb(cardData.accentColor || '#B87333');
    return {
        formatVersion: 1,
        passTypeIdentifier: 'pass.com.cardcraft.businesscard',
        serialNumber: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        teamIdentifier: 'TEAM_ID',
        organizationName: cardData.company || 'CardCraft',
        description: `${cardData.fullName || 'Business Card'}'s Business Card`,
        logoText: cardData.company || '',
        foregroundColor: 'rgb(255, 255, 255)',
        backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        labelColor: 'rgb(255, 255, 255)',
        generic: {
            primaryFields: [{ key: 'name', label: 'NAME', value: cardData.fullName || 'Name' }],
            secondaryFields: [
                { key: 'title', label: 'TITLE', value: cardData.jobTitle || '' },
                { key: 'company', label: 'COMPANY', value: cardData.company || '' }
            ],
            auxiliaryFields: [
                { key: 'email', label: 'EMAIL', value: cardData.email || '' },
                { key: 'phone', label: 'PHONE', value: cardData.phone || '' }
            ],
            backFields: [
                { key: 'website', label: 'Website', value: cardData.website || '' },
                { key: 'location', label: 'Location', value: cardData.location || '' },
                { key: 'linkedin', label: 'LinkedIn', value: cardData.linkedin || '' },
                { key: 'twitter', label: 'Twitter/X', value: cardData.twitter || '' }
            ]
        },
        barcode: { message: cardUrl, format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1' },
        barcodes: [{ message: cardUrl, format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1' }]
    };
}

function createGoogleWalletObject(cardData, cardUrl) {
    return {
        id: `cardcraft.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
        classId: 'cardcraft.businesscard',
        cardTitle: { defaultValue: { language: 'en', value: cardData.company || 'Business Card' } },
        header: { defaultValue: { language: 'en', value: cardData.fullName || 'Name' } },
        subheader: { defaultValue: { language: 'en', value: cardData.jobTitle || '' } },
        textModulesData: [
            { id: 'contact', header: 'Contact', body: [cardData.email, cardData.phone, cardData.website].filter(Boolean).join('\n') },
            { id: 'location', header: 'Location', body: cardData.location || '' }
        ].filter(m => m.body),
        linksModuleData: {
            uris: [
                cardData.website ? { uri: cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`, description: 'Website' } : null,
                { uri: cardUrl, description: 'View Digital Card' }
            ].filter(Boolean)
        },
        barcode: { type: 'QR_CODE', value: cardUrl },
        hexBackgroundColor: cardData.accentColor || '#B87333'
    };
}

function generateVCard(cardData) {
    const parts = (cardData.fullName || '').trim().split(' ');
    const formatName = parts.length >= 2 ? `${parts.pop()};${parts.join(' ')};;;` : `${cardData.fullName || ''};;;;`;
    const websiteUrl = cardData.website ? (cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`) : '';

    const lines = [
        'BEGIN:VCARD', 'VERSION:3.0',
        `FN:${cardData.fullName || ''}`, `N:${formatName}`,
        `TITLE:${cardData.jobTitle || ''}`, `ORG:${cardData.company || ''}`,
        `EMAIL:${cardData.email || ''}`, `TEL:${cardData.phone || ''}`,
        `URL:${websiteUrl}`, `ADR:;;${cardData.location || ''};;;;`,
        'END:VCARD'
    ];
    return lines.join('\r\n');
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

export async function onRequestPost(context) {
    const { request } = context;

    try {
        const { type, cardData, cardUrl } = await request.json();

        if (!cardData) {
            return new Response(JSON.stringify({ error: 'Missing cardData' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const shareUrl = cardUrl || 'https://cardcraft.pages.dev';

        if (type === 'apple') {
            const passJson = createApplePassJson(cardData, shareUrl);
            const pkpassData = await createPKPass(passJson);
            return new Response(pkpassData, {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/vnd.apple.pkpass',
                    'Content-Disposition': `attachment; filename="${(cardData.fullName || 'card').replace(/\s+/g, '_')}.pkpass"`
                }
            });
        }

        if (type === 'google') {
            const passObject = createGoogleWalletObject(cardData, shareUrl);
            const passData = {
                iss: 'cardcraft@cardcraft.iam.gserviceaccount.com',
                aud: 'google', typ: 'savetowallet',
                iat: Math.floor(Date.now() / 1000),
                payload: { genericObjects: [passObject] }
            };
            const encodedPass = btoa(JSON.stringify(passData));
            return new Response(JSON.stringify({
                success: true, passObject,
                saveUrl: `https://pay.google.com/gp/v/save/${encodedPass}`,
                vcard: generateVCard(cardData)
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (type === 'vcard') {
            const vcard = generateVCard(cardData);
            return new Response(vcard, {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'text/vcard',
                    'Content-Disposition': `attachment; filename="${(cardData.fullName || 'contact').replace(/\s+/g, '_')}.vcf"`
                }
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid type' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to generate pass', message: error.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders });
}
