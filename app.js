/**
 * CardCraft — Virtual Business Card Studio
 * Interactive business card editor with live preview and sharing features
 */

class CardCraft {
    constructor() {
        this.card = document.getElementById('businessCard');
        this.currentStyle = 'modern';
        this.currentFont = 'serif';
        this.profileImage = null;
        this.logoImage = null;
        this.cardId = null;

        this.init();
    }

    init() {
        this.bindInputs();
        this.bindUploads();
        this.bindStyleSelectors();
        this.bindColorPickers();
        this.bindColorPresets();
        this.bindFontSelectors();
        this.bindViewControls();
        this.bindExport();
        this.bindSharing();
        this.bindNFC();
        this.bindWalletPasses();
        this.generateQRCode();
        this.loadFromURL();
        this.checkNFCSupport();
    }

    // ═══════════════════════════════════════════════════════════════
    // Input Bindings
    // ═══════════════════════════════════════════════════════════════

    bindInputs() {
        const inputMappings = [
            { input: 'fullName', target: 'cardName', fallback: 'Your Name', also: 'backName' },
            { input: 'jobTitle', target: 'cardTitle', fallback: 'Job Title' },
            { input: 'company', target: 'cardCompany', fallback: 'Company Name' },
            { input: 'email', target: 'cardEmail', fallback: 'email@example.com', wrapper: 'emailItem' },
            { input: 'phone', target: 'cardPhone', fallback: '+1 (555) 000-0000', wrapper: 'phoneItem' },
            { input: 'website', target: 'cardWebsite', fallback: 'www.website.com', wrapper: 'websiteItem' },
            { input: 'location', target: 'cardLocation', fallback: 'City, Country', wrapper: 'locationItem' },
            { input: 'linkedin', target: 'cardLinkedin', fallback: 'LinkedIn', wrapper: 'linkedinLink' },
            { input: 'twitter', target: 'cardTwitter', fallback: 'Twitter', wrapper: 'twitterLink' },
            { input: 'instagram', target: 'cardInstagram', fallback: 'Instagram', wrapper: 'instagramLink' },
        ];

        inputMappings.forEach(({ input, target, fallback, wrapper, also }) => {
            const inputEl = document.getElementById(input);
            const targetEl = document.getElementById(target);
            const wrapperEl = wrapper ? document.getElementById(wrapper) : null;
            const alsoEl = also ? document.getElementById(also) : null;

            if (inputEl && targetEl) {
                inputEl.addEventListener('input', () => {
                    const value = inputEl.value.trim();
                    targetEl.textContent = value || fallback;

                    if (alsoEl) {
                        alsoEl.textContent = value || fallback;
                    }

                    if (wrapperEl) {
                        wrapperEl.classList.toggle('hidden', !value);
                    }

                    // Update QR code when website changes
                    if (input === 'website' || input === 'email') {
                        this.generateQRCode();
                    }
                });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Image Upload Handlers
    // ═══════════════════════════════════════════════════════════════

    bindUploads() {
        // Profile Photo Upload
        const profileUpload = document.getElementById('profileUpload');
        const profileInput = document.getElementById('profileInput');
        const profilePreview = document.getElementById('profilePreview');

        profileUpload.addEventListener('click', () => profileInput.click());
        profileInput.addEventListener('change', (e) => {
            this.handleImageUpload(e, profilePreview, 'profile');
        });

        // Company Logo Upload
        const logoUpload = document.getElementById('logoUpload');
        const logoInput = document.getElementById('logoInput');
        const logoPreview = document.getElementById('logoPreview');

        logoUpload.addEventListener('click', () => logoInput.click());
        logoInput.addEventListener('change', (e) => {
            this.handleImageUpload(e, logoPreview, 'logo');
        });

        // Drag and drop support
        [profileUpload, logoUpload].forEach((upload, index) => {
            upload.addEventListener('dragover', (e) => {
                e.preventDefault();
                upload.querySelector('.upload-preview').style.borderColor = 'var(--accent)';
            });

            upload.addEventListener('dragleave', () => {
                upload.querySelector('.upload-preview').style.borderColor = '';
            });

            upload.addEventListener('drop', (e) => {
                e.preventDefault();
                upload.querySelector('.upload-preview').style.borderColor = '';
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    const preview = upload.querySelector('.upload-preview');
                    const type = index === 0 ? 'profile' : 'logo';
                    this.processImage(file, preview, type);
                }
            });
        });
    }

    handleImageUpload(e, previewEl, type) {
        const file = e.target.files[0];
        if (file) {
            this.processImage(file, previewEl, type);
        }
    }

    processImage(file, previewEl, type) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgData = e.target.result;

            // Update preview in editor
            previewEl.innerHTML = `<img src="${imgData}" alt="${type}">`;
            previewEl.classList.add('has-image');

            // Update card
            if (type === 'profile') {
                this.profileImage = imgData;
                const cardProfile = document.getElementById('cardProfileImage');
                cardProfile.innerHTML = `<img src="${imgData}" alt="Profile">`;
            } else {
                this.logoImage = imgData;
                const cardLogo = document.getElementById('cardLogo');
                cardLogo.innerHTML = `<img src="${imgData}" alt="Logo">`;
                const backLogo = document.getElementById('backLogo');
                backLogo.innerHTML = `<img src="${imgData}" alt="Logo">`;
            }
        };
        reader.readAsDataURL(file);
    }

    // ═══════════════════════════════════════════════════════════════
    // Style Selection
    // ═══════════════════════════════════════════════════════════════

    bindStyleSelectors() {
        const styleOptions = document.querySelectorAll('.style-option');

        styleOptions.forEach(option => {
            option.addEventListener('click', () => {
                styleOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');

                const style = option.dataset.style;
                this.currentStyle = style;
                this.card.className = `business-card style-${style} font-${this.currentFont}`;
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Color Customization
    // ═══════════════════════════════════════════════════════════════

    bindColorPickers() {
        const primaryColor = document.getElementById('primaryColor');
        const accentColor = document.getElementById('accentColor');
        const primaryValue = document.getElementById('primaryColorValue');
        const accentValue = document.getElementById('accentColorValue');

        primaryColor.addEventListener('input', (e) => {
            const color = e.target.value;
            primaryValue.textContent = color;
            document.documentElement.style.setProperty('--card-primary', color);
        });

        accentColor.addEventListener('input', (e) => {
            const color = e.target.value;
            accentValue.textContent = color;
            document.documentElement.style.setProperty('--card-accent', color);
        });
    }

    bindColorPresets() {
        const presets = document.querySelectorAll('.preset-btn');

        presets.forEach(preset => {
            preset.addEventListener('click', () => {
                const primary = preset.dataset.primary;
                const accent = preset.dataset.accent;

                document.getElementById('primaryColor').value = primary;
                document.getElementById('accentColor').value = accent;
                document.getElementById('primaryColorValue').textContent = primary;
                document.getElementById('accentColorValue').textContent = accent;

                document.documentElement.style.setProperty('--card-primary', primary);
                document.documentElement.style.setProperty('--card-accent', accent);

                preset.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    preset.style.transform = '';
                }, 200);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Font Selection
    // ═══════════════════════════════════════════════════════════════

    bindFontSelectors() {
        const fontOptions = document.querySelectorAll('.font-option');

        fontOptions.forEach(option => {
            option.addEventListener('click', () => {
                fontOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');

                const font = option.dataset.font;
                this.currentFont = font;
                this.card.className = `business-card style-${this.currentStyle} font-${font}`;
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // View Controls (Front/Back)
    // ═══════════════════════════════════════════════════════════════

    bindViewControls() {
        const viewToggles = document.querySelectorAll('.view-toggle');

        viewToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                viewToggles.forEach(t => t.classList.remove('active'));
                toggle.classList.add('active');

                const view = toggle.dataset.view;
                if (view === 'back') {
                    this.card.classList.add('flipped');
                } else {
                    this.card.classList.remove('flipped');
                }
            });
        });

        this.card.addEventListener('click', () => {
            this.card.classList.toggle('flipped');
            viewToggles.forEach(t => {
                const isBack = this.card.classList.contains('flipped');
                t.classList.toggle('active', t.dataset.view === (isBack ? 'back' : 'front'));
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // QR Code Generation
    // ═══════════════════════════════════════════════════════════════

    generateQRCode() {
        const qrContainer = document.getElementById('qrCode');
        const website = document.getElementById('website').value.trim();
        const email = document.getElementById('email').value.trim();

        let qrData = website || email || 'https://example.com';

        if (website && !website.startsWith('http')) {
            qrData = 'https://' + website;
        } else if (!website && email) {
            qrData = 'mailto:' + email;
        }

        qrContainer.innerHTML = '';

        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(qrData, {
                width: 72,
                margin: 0,
                color: {
                    dark: '#1a1a2e',
                    light: '#ffffff'
                }
            }, (error, canvas) => {
                if (error) {
                    console.error(error);
                    return;
                }
                qrContainer.appendChild(canvas);
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Get Card Data
    // ═══════════════════════════════════════════════════════════════

    getCardData() {
        return {
            fullName: document.getElementById('fullName').value.trim(),
            jobTitle: document.getElementById('jobTitle').value.trim(),
            company: document.getElementById('company').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            website: document.getElementById('website').value.trim(),
            location: document.getElementById('location').value.trim(),
            linkedin: document.getElementById('linkedin').value.trim(),
            twitter: document.getElementById('twitter').value.trim(),
            instagram: document.getElementById('instagram').value.trim(),
            style: this.currentStyle,
            font: this.currentFont,
            primaryColor: document.getElementById('primaryColor').value,
            accentColor: document.getElementById('accentColor').value,
            profileImage: this.profileImage,
            logoImage: this.logoImage
        };
    }

    setCardData(data) {
        const fields = ['fullName', 'jobTitle', 'company', 'email', 'phone', 'website', 'location', 'linkedin', 'twitter', 'instagram'];

        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input && data[field]) {
                input.value = data[field];
                input.dispatchEvent(new Event('input'));
            }
        });

        if (data.style) {
            const styleBtn = document.querySelector(`[data-style="${data.style}"]`);
            if (styleBtn) styleBtn.click();
        }

        if (data.font) {
            const fontBtn = document.querySelector(`[data-font="${data.font}"]`);
            if (fontBtn) fontBtn.click();
        }

        if (data.primaryColor) {
            document.getElementById('primaryColor').value = data.primaryColor;
            document.getElementById('primaryColor').dispatchEvent(new Event('input'));
        }

        if (data.accentColor) {
            document.getElementById('accentColor').value = data.accentColor;
            document.getElementById('accentColor').dispatchEvent(new Event('input'));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Shareable URL Generation
    // ═══════════════════════════════════════════════════════════════

    generateShareableURL() {
        const data = this.getCardData();
        // Remove images for URL (too large)
        delete data.profileImage;
        delete data.logoImage;

        const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?card=${encoded}`;
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const cardData = params.get('card');

        if (cardData) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(cardData)));
                this.setCardData(decoded);

                // Update URL display
                const urlInput = document.getElementById('cardUrl');
                if (urlInput) {
                    urlInput.value = window.location.href;
                }
            } catch (e) {
                console.error('Failed to load card from URL:', e);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Sharing Features
    // ═══════════════════════════════════════════════════════════════

    bindSharing() {
        // Generate Link Button
        const generateLinkBtn = document.getElementById('generateLinkBtn');
        const cardUrlInput = document.getElementById('cardUrl');
        const copyUrlBtn = document.getElementById('copyUrlBtn');

        generateLinkBtn.addEventListener('click', () => {
            const url = this.generateShareableURL();
            cardUrlInput.value = url;

            // Update browser URL without reload
            window.history.pushState({}, '', url);

            // Auto-copy
            this.copyToClipboard(url);
            this.showCopyFeedback(copyUrlBtn);
        });

        // Copy URL Button
        copyUrlBtn.addEventListener('click', () => {
            const url = cardUrlInput.value;
            if (url) {
                this.copyToClipboard(url);
                this.showCopyFeedback(copyUrlBtn);
            }
        });

        // WhatsApp Share
        document.getElementById('shareWhatsApp').addEventListener('click', () => {
            const data = this.getCardData();
            const url = this.generateShareableURL();
            const message = `Check out my digital business card!\n\n${data.fullName || 'My Card'}\n${data.jobTitle || ''} ${data.company ? 'at ' + data.company : ''}\n\n${url}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        });

        // SMS Share
        document.getElementById('shareSMS').addEventListener('click', () => {
            const data = this.getCardData();
            const url = this.generateShareableURL();
            const message = `Check out my digital business card: ${data.fullName || 'My Card'} - ${url}`;
            window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
        });

        // Email Share
        document.getElementById('shareEmail').addEventListener('click', () => {
            const data = this.getCardData();
            const url = this.generateShareableURL();
            const subject = `${data.fullName || 'My'} Digital Business Card`;
            const body = `Hi,\n\nHere's my digital business card:\n\n${data.fullName || ''}\n${data.jobTitle || ''} ${data.company ? 'at ' + data.company : ''}\n\nView my card: ${url}\n\nBest regards,\n${data.fullName || ''}`;
            window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
        });

        // Native Share (Web Share API)
        document.getElementById('shareNative').addEventListener('click', async () => {
            const data = this.getCardData();
            const url = this.generateShareableURL();

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `${data.fullName || 'Digital'} Business Card`,
                        text: `Check out my digital business card - ${data.fullName || 'CardCraft'}`,
                        url: url
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Share failed:', err);
                    }
                }
            } else {
                // Fallback: copy to clipboard
                this.copyToClipboard(url);
                alert('Link copied to clipboard!');
            }
        });
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }

    showCopyFeedback(btn) {
        btn.classList.add('copied');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = originalHTML;
        }, 2000);
    }

    // ═══════════════════════════════════════════════════════════════
    // vCard Generation
    // ═══════════════════════════════════════════════════════════════

    generateVCard() {
        const data = this.getCardData();
        const nameParts = (data.fullName || 'Your Name').split(' ');
        const lastName = nameParts.length > 1 ? nameParts.pop() : '';
        const firstName = nameParts.join(' ');

        let vcard = `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${data.fullName || 'Your Name'}
ORG:${data.company || ''}
TITLE:${data.jobTitle || ''}`;

        if (data.email) {
            vcard += `\nEMAIL;TYPE=INTERNET,WORK:${data.email}`;
        }
        if (data.phone) {
            vcard += `\nTEL;TYPE=CELL:${data.phone}`;
        }
        if (data.website) {
            const url = data.website.startsWith('http') ? data.website : `https://${data.website}`;
            vcard += `\nURL:${url}`;
        }
        if (data.location) {
            vcard += `\nADR;TYPE=WORK:;;${data.location};;;;`;
        }
        if (data.linkedin) {
            const linkedinUrl = data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`;
            vcard += `\nX-SOCIALPROFILE;TYPE=linkedin:${linkedinUrl}`;
        }
        if (data.twitter) {
            const handle = data.twitter.replace('@', '');
            vcard += `\nX-SOCIALPROFILE;TYPE=twitter:https://twitter.com/${handle}`;
        }
        if (data.instagram) {
            const handle = data.instagram.replace('@', '');
            vcard += `\nX-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${handle}`;
        }

        // Add photo if available (small version)
        if (this.profileImage && this.profileImage.startsWith('data:image')) {
            const base64Data = this.profileImage.split(',')[1];
            if (base64Data && base64Data.length < 50000) { // Limit size
                vcard += `\nPHOTO;ENCODING=b;TYPE=JPEG:${base64Data}`;
            }
        }

        vcard += `\nREV:${new Date().toISOString()}
END:VCARD`;

        return vcard;
    }

    downloadVCard() {
        const vcard = this.generateVCard();
        const data = this.getCardData();
        const filename = `${(data.fullName || 'contact').replace(/\s+/g, '_')}.vcf`;

        const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
    }

    // ═══════════════════════════════════════════════════════════════
    // NFC Sharing
    // ═══════════════════════════════════════════════════════════════

    checkNFCSupport() {
        const nfcSection = document.getElementById('nfcSection');
        if (!('NDEFReader' in window)) {
            nfcSection.classList.add('hidden');
        }
    }

    bindNFC() {
        const nfcBtn = document.getElementById('nfcBtn');
        const nfcStatus = document.getElementById('nfcStatus');

        nfcBtn.addEventListener('click', async () => {
            if (!('NDEFReader' in window)) {
                nfcStatus.textContent = 'NFC not supported on this device';
                nfcStatus.className = 'nfc-status error';
                return;
            }

            try {
                nfcBtn.classList.add('scanning');
                nfcStatus.textContent = 'Tap your NFC tag or another device...';
                nfcStatus.className = 'nfc-status';

                const ndef = new NDEFReader();
                await ndef.write({
                    records: [
                        {
                            recordType: 'url',
                            data: this.generateShareableURL()
                        },
                        {
                            recordType: 'text',
                            data: this.generateVCard()
                        }
                    ]
                });

                nfcBtn.classList.remove('scanning');
                nfcStatus.textContent = 'Card shared successfully!';
                nfcStatus.className = 'nfc-status success';

                setTimeout(() => {
                    nfcStatus.textContent = '';
                }, 3000);

            } catch (error) {
                nfcBtn.classList.remove('scanning');

                if (error.name === 'NotAllowedError') {
                    nfcStatus.textContent = 'NFC permission denied. Please enable NFC.';
                } else if (error.name === 'NotSupportedError') {
                    nfcStatus.textContent = 'NFC not supported on this device.';
                } else {
                    nfcStatus.textContent = 'NFC sharing cancelled or failed.';
                }
                nfcStatus.className = 'nfc-status error';
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Wallet Passes
    // ═══════════════════════════════════════════════════════════════

    bindWalletPasses() {
        const appleWalletBtn = document.getElementById('appleWalletBtn');
        const googleWalletBtn = document.getElementById('googleWalletBtn');

        appleWalletBtn.addEventListener('click', () => {
            this.generateAppleWalletPass();
        });

        googleWalletBtn.addEventListener('click', () => {
            this.generateGoogleWalletPass();
        });
    }

    async generateAppleWalletPass() {
        const data = this.getCardData();

        // For Apple Wallet, we need a server to sign the pass
        // Since this is client-side only, we'll create a .pkpass-like structure
        // and provide instructions or use a service

        const passData = {
            formatVersion: 1,
            passTypeIdentifier: 'pass.com.cardcraft.businesscard',
            serialNumber: Date.now().toString(),
            teamIdentifier: 'CARDCRAFT',
            organizationName: data.company || 'CardCraft',
            description: `${data.fullName}'s Business Card`,
            logoText: data.company || data.fullName,
            foregroundColor: 'rgb(255, 255, 255)',
            backgroundColor: data.primaryColor || 'rgb(26, 26, 46)',
            generic: {
                primaryFields: [
                    {
                        key: 'name',
                        label: 'NAME',
                        value: data.fullName || 'Your Name'
                    }
                ],
                secondaryFields: [
                    {
                        key: 'title',
                        label: 'TITLE',
                        value: data.jobTitle || ''
                    },
                    {
                        key: 'company',
                        label: 'COMPANY',
                        value: data.company || ''
                    }
                ],
                auxiliaryFields: [
                    {
                        key: 'phone',
                        label: 'PHONE',
                        value: data.phone || ''
                    },
                    {
                        key: 'email',
                        label: 'EMAIL',
                        value: data.email || ''
                    }
                ],
                backFields: [
                    {
                        key: 'website',
                        label: 'Website',
                        value: data.website || ''
                    },
                    {
                        key: 'linkedin',
                        label: 'LinkedIn',
                        value: data.linkedin || ''
                    },
                    {
                        key: 'location',
                        label: 'Location',
                        value: data.location || ''
                    }
                ]
            }
        };

        // Since Apple Wallet requires server-side signing, we'll offer alternatives
        // Option 1: Download vCard instead (works everywhere)
        // Option 2: Show a QR code for the shareable URL

        const choice = confirm(
            'Apple Wallet passes require server-side generation.\n\n' +
            'Would you like to:\n' +
            '• OK - Download as vCard (Add to Contacts)\n' +
            '• Cancel - Copy shareable link instead'
        );

        if (choice) {
            this.downloadVCard();
        } else {
            const url = this.generateShareableURL();
            this.copyToClipboard(url);
            alert('Shareable link copied to clipboard!\n\nOpen this link on your iPhone to view your card.');
        }
    }

    async generateGoogleWalletPass() {
        const data = this.getCardData();

        // Google Wallet also requires server-side JWT signing
        // We'll provide a similar fallback

        const genericObject = {
            id: `cardcraft.${Date.now()}`,
            classId: 'cardcraft.businesscard',
            genericType: 'GENERIC_TYPE_UNSPECIFIED',
            hexBackgroundColor: data.primaryColor || '#1a1a2e',
            logo: {
                sourceUri: {
                    uri: 'https://cardcraft.app/logo.png'
                }
            },
            cardTitle: {
                defaultValue: {
                    language: 'en',
                    value: data.fullName || 'Business Card'
                }
            },
            subheader: {
                defaultValue: {
                    language: 'en',
                    value: data.jobTitle || ''
                }
            },
            header: {
                defaultValue: {
                    language: 'en',
                    value: data.company || ''
                }
            },
            textModulesData: [
                {
                    id: 'phone',
                    header: 'Phone',
                    body: data.phone || ''
                },
                {
                    id: 'email',
                    header: 'Email',
                    body: data.email || ''
                },
                {
                    id: 'website',
                    header: 'Website',
                    body: data.website || ''
                }
            ],
            barcode: {
                type: 'QR_CODE',
                value: this.generateShareableURL()
            }
        };

        const choice = confirm(
            'Google Wallet passes require server-side generation.\n\n' +
            'Would you like to:\n' +
            '• OK - Download as vCard (Add to Contacts)\n' +
            '• Cancel - Copy shareable link instead'
        );

        if (choice) {
            this.downloadVCard();
        } else {
            const url = this.generateShareableURL();
            this.copyToClipboard(url);
            alert('Shareable link copied to clipboard!\n\nOpen this link on your Android device to view your card.');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Export Functionality
    // ═══════════════════════════════════════════════════════════════

    bindExport() {
        const exportBtn = document.getElementById('exportBtn');
        const vCardBtn = document.getElementById('vCardBtn');

        exportBtn.addEventListener('click', async () => {
            exportBtn.disabled = true;
            const originalHTML = exportBtn.innerHTML;
            exportBtn.innerHTML = `
                <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"/>
                </svg>
                Generating...
            `;

            try {
                await this.exportCards();
            } catch (error) {
                console.error('Export failed:', error);
                alert('Export failed. Please try again.');
            }

            exportBtn.disabled = false;
            exportBtn.innerHTML = originalHTML;
        });

        vCardBtn.addEventListener('click', () => {
            this.downloadVCard();
        });
    }

    async exportCards() {
        const wasFlipped = this.card.classList.contains('flipped');

        const originalTransform = this.card.style.transform;
        this.card.style.transform = 'none';
        this.card.classList.remove('flipped');

        await new Promise(resolve => setTimeout(resolve, 100));

        const frontCanvas = await html2canvas(document.getElementById('cardFront'), {
            scale: 3,
            backgroundColor: null,
            useCORS: true,
            logging: false
        });

        this.card.classList.add('flipped');
        await new Promise(resolve => setTimeout(resolve, 100));

        const backCanvas = await html2canvas(document.getElementById('cardBack'), {
            scale: 3,
            backgroundColor: null,
            useCORS: true,
            logging: false
        });

        this.card.style.transform = originalTransform;
        if (!wasFlipped) {
            this.card.classList.remove('flipped');
        }

        const combinedCanvas = document.createElement('canvas');
        const gap = 60;
        combinedCanvas.width = frontCanvas.width;
        combinedCanvas.height = frontCanvas.height * 2 + gap;

        const ctx = combinedCanvas.getContext('2d');
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

        ctx.drawImage(frontCanvas, 0, 0);
        ctx.drawImage(backCanvas, 0, frontCanvas.height + gap);

        const link = document.createElement('a');
        const data = this.getCardData();
        link.download = `${(data.fullName || 'business-card').replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = combinedCanvas.toDataURL('image/png');
        link.click();
    }
}

// Add spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new CardCraft();
});
