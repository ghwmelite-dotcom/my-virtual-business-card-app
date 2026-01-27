/* ═══════════════════════════════════════════════════════════════
   CardCraft — Application Logic
   Refined luxury digital business card studio
   ═══════════════════════════════════════════════════════════════ */

class CardCraft {
    constructor() {
        this.state = {
            // Content
            fullName: '',
            jobTitle: '',
            company: '',
            email: '',
            phone: '',
            website: '',
            location: '',
            linkedin: '',
            twitter: '',
            profilePhoto: null,
            companyLogo: null,

            // Style
            cardStyle: 'light',
            accentColor: '#B87333',
            fontStyle: 'classic',

            // View
            isFlipped: false,
            currentTab: 'content',

            // Theme
            theme: 'light'
        };

        this.init();
    }

    init() {
        this.initTheme();
        this.bindElements();
        this.bindEvents();
        this.loadFromURL();
        this.generateQRCode();
    }

    // ═══════════════════════════════════════════════════════════════
    // Theme Management
    // ═══════════════════════════════════════════════════════════════

    initTheme() {
        // Prevent flash during initial load
        document.body.classList.add('no-transition');

        // Check for saved preference
        const savedTheme = localStorage.getItem('cardcraft-theme');

        if (savedTheme) {
            this.state.theme = savedTheme;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.state.theme = prefersDark ? 'dark' : 'light';
        }

        // Apply theme
        this.applyTheme(false);

        // Re-enable transitions after a frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.classList.remove('no-transition');
            });
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't set a preference
            if (!localStorage.getItem('cardcraft-theme')) {
                this.state.theme = e.matches ? 'dark' : 'light';
                this.applyTheme(true);
            }
        });
    }

    toggleTheme() {
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('cardcraft-theme', this.state.theme);
        this.applyTheme(true);
    }

    applyTheme(animate = true) {
        const root = document.documentElement;

        if (!animate) {
            document.body.classList.add('no-transition');
        }

        root.setAttribute('data-theme', this.state.theme);

        if (!animate) {
            requestAnimationFrame(() => {
                document.body.classList.remove('no-transition');
            });
        }

        // Update meta theme-color for mobile browsers
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', this.state.theme === 'dark' ? '#0D0D0F' : '#FAF9F7');
        }
    }

    bindElements() {
        // Inputs - Content
        this.inputs = {
            fullName: document.getElementById('fullName'),
            jobTitle: document.getElementById('jobTitle'),
            company: document.getElementById('company'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            website: document.getElementById('website'),
            location: document.getElementById('location'),
            linkedin: document.getElementById('linkedin'),
            twitter: document.getElementById('twitter')
        };

        // Card elements
        this.card = {
            container: document.getElementById('cardContainer'),
            element: document.getElementById('businessCard'),
            front: document.getElementById('cardFront'),
            back: document.getElementById('cardBack'),
            photo: document.getElementById('cardPhoto'),
            logo: document.getElementById('cardLogo'),
            name: document.getElementById('cardName'),
            title: document.getElementById('cardTitle'),
            company: document.getElementById('cardCompany'),
            at: document.getElementById('cardAt'),
            email: document.getElementById('cardEmail'),
            phone: document.getElementById('cardPhone'),
            website: document.getElementById('cardWebsite'),
            location: document.getElementById('cardLocation'),
            linkedin: document.getElementById('cardLinkedin'),
            twitter: document.getElementById('cardTwitter'),
            backName: document.getElementById('backName'),
            qrCode: document.getElementById('qrCode')
        };

        // Contact rows (for visibility toggle)
        this.contactRows = {
            email: document.getElementById('emailRow'),
            phone: document.getElementById('phoneRow'),
            website: document.getElementById('websiteRow'),
            location: document.getElementById('locationRow')
        };

        // Social items
        this.socialItems = {
            linkedin: document.getElementById('linkedinItem'),
            twitter: document.getElementById('twitterItem')
        };

        // Upload elements
        this.uploads = {
            photoBox: document.getElementById('photoUpload'),
            photoInput: document.getElementById('photoInput'),
            photoPreview: document.getElementById('photoPreview'),
            logoBox: document.getElementById('logoUpload'),
            logoInput: document.getElementById('logoInput'),
            logoPreview: document.getElementById('logoPreview')
        };

        // Tabs
        this.tabs = document.querySelectorAll('.tab');
        this.tabPanels = document.querySelectorAll('.tab-panel');

        // Style controls
        this.styleCards = document.querySelectorAll('.style-card');
        this.colorSwatches = document.querySelectorAll('.color-swatch');
        this.customColorInput = document.getElementById('customColor');
        this.fontOptions = document.querySelectorAll('.font-option');

        // View controls
        this.viewButtons = document.querySelectorAll('.control-btn[data-view]');

        // Share elements
        this.shareUrl = document.getElementById('shareUrl');
        this.copyUrlBtn = document.getElementById('copyUrl');
        this.generateLinkBtn = document.getElementById('generateLink');
        this.shareWhatsApp = document.getElementById('shareWhatsApp');
        this.shareEmail = document.getElementById('shareEmail');
        this.shareSMS = document.getElementById('shareSMS');
        this.shareNative = document.getElementById('shareNative');

        // Download elements
        this.downloadVCard = document.getElementById('downloadVCard');
        this.downloadPNG = document.getElementById('downloadPNG');

        // Nav actions
        this.previewModeBtn = document.getElementById('previewModeBtn');
        this.exportBtn = document.getElementById('exportBtn');

        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
    }

    bindEvents() {
        // Text inputs - live update
        Object.entries(this.inputs).forEach(([key, input]) => {
            if (input) {
                input.addEventListener('input', () => this.updateField(key, input.value));
            }
        });

        // Tabs
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Photo upload
        if (this.uploads.photoBox) {
            this.uploads.photoBox.addEventListener('click', () => this.uploads.photoInput.click());
            this.uploads.photoInput.addEventListener('change', (e) => this.handleImageUpload(e, 'photo'));
            this.setupDragDrop(this.uploads.photoBox, 'photo');
        }

        // Logo upload
        if (this.uploads.logoBox) {
            this.uploads.logoBox.addEventListener('click', () => this.uploads.logoInput.click());
            this.uploads.logoInput.addEventListener('change', (e) => this.handleImageUpload(e, 'logo'));
            this.setupDragDrop(this.uploads.logoBox, 'logo');
        }

        // Style cards
        this.styleCards.forEach(card => {
            card.addEventListener('click', () => this.setCardStyle(card.dataset.style));
        });

        // Color swatches
        this.colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => this.setAccentColor(swatch.dataset.color, swatch));
        });

        // Custom color
        if (this.customColorInput) {
            this.customColorInput.addEventListener('input', (e) => {
                this.colorSwatches.forEach(s => s.classList.remove('active'));
                this.setAccentColor(e.target.value, null);
            });
        }

        // Font options
        this.fontOptions.forEach(option => {
            option.addEventListener('click', () => this.setFontStyle(option.dataset.font));
        });

        // Card flip (click)
        if (this.card.element) {
            this.card.element.addEventListener('click', () => this.flipCard());
        }

        // View buttons
        this.viewButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setView(btn.dataset.view));
        });

        // Share link
        if (this.generateLinkBtn) {
            this.generateLinkBtn.addEventListener('click', () => this.generateShareLink());
        }

        if (this.copyUrlBtn) {
            this.copyUrlBtn.addEventListener('click', () => this.copyShareLink());
        }

        // Quick share buttons
        if (this.shareWhatsApp) {
            this.shareWhatsApp.addEventListener('click', () => this.shareVia('whatsapp'));
        }

        if (this.shareEmail) {
            this.shareEmail.addEventListener('click', () => this.shareVia('email'));
        }

        if (this.shareSMS) {
            this.shareSMS.addEventListener('click', () => this.shareVia('sms'));
        }

        if (this.shareNative) {
            this.shareNative.addEventListener('click', () => this.shareVia('native'));
        }

        // Downloads
        if (this.downloadVCard) {
            this.downloadVCard.addEventListener('click', () => this.generateVCard());
        }

        if (this.downloadPNG) {
            this.downloadPNG.addEventListener('click', () => this.exportCard());
        }

        // Nav actions
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportCard());
        }

        if (this.previewModeBtn) {
            this.previewModeBtn.addEventListener('click', () => this.togglePreviewMode());
        }

        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Tab Management
    // ═══════════════════════════════════════════════════════════════

    switchTab(tabName) {
        this.state.currentTab = tabName;

        // Update tab buttons
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab panels
        this.tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Content Updates
    // ═══════════════════════════════════════════════════════════════

    updateField(field, value) {
        this.state[field] = value;

        switch (field) {
            case 'fullName':
                this.card.name.textContent = value || 'Your Name';
                this.card.backName.textContent = value || 'Your Name';
                break;
            case 'jobTitle':
                this.card.title.textContent = value || 'Title';
                this.updateRoleVisibility();
                break;
            case 'company':
                this.card.company.textContent = value || 'Company';
                this.updateRoleVisibility();
                break;
            case 'email':
                this.card.email.textContent = value || 'email@example.com';
                this.contactRows.email.classList.toggle('hidden', !value);
                this.generateQRCode();
                break;
            case 'phone':
                this.card.phone.textContent = value || '+1 000 000 0000';
                this.contactRows.phone.classList.toggle('hidden', !value);
                break;
            case 'website':
                this.card.website.textContent = value || 'website.com';
                this.contactRows.website.classList.toggle('hidden', !value);
                this.generateQRCode();
                break;
            case 'location':
                this.card.location.textContent = value || 'City, Country';
                this.contactRows.location.classList.toggle('hidden', !value);
                break;
            case 'linkedin':
                this.card.linkedin.textContent = value || 'LinkedIn';
                this.socialItems.linkedin.classList.toggle('hidden', !value);
                if (value) {
                    this.socialItems.linkedin.href = value.startsWith('http')
                        ? value
                        : `https://linkedin.com/${value}`;
                }
                break;
            case 'twitter':
                this.card.twitter.textContent = value || 'Twitter';
                this.socialItems.twitter.classList.toggle('hidden', !value);
                if (value) {
                    const handle = value.replace('@', '');
                    this.socialItems.twitter.href = `https://twitter.com/${handle}`;
                }
                break;
        }
    }

    updateRoleVisibility() {
        const hasTitle = this.state.jobTitle;
        const hasCompany = this.state.company;

        if (this.card.at) {
            this.card.at.style.display = (hasTitle && hasCompany) ? 'inline' : 'none';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Image Upload
    // ═══════════════════════════════════════════════════════════════

    setupDragDrop(element, type) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            element.addEventListener(eventName, () => {
                element.querySelector('.upload-preview').style.borderColor = 'var(--accent)';
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, () => {
                element.querySelector('.upload-preview').style.borderColor = '';
            });
        });

        element.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.processImage(file, type);
            }
        });
    }

    handleImageUpload(e, type) {
        const file = e.target.files[0];
        if (file) {
            this.processImage(file, type);
        }
    }

    processImage(file, type) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;

            if (type === 'photo') {
                this.state.profilePhoto = dataUrl;
                this.updatePhotoPreview(dataUrl);
                this.updateCardPhoto(dataUrl);
            } else {
                this.state.companyLogo = dataUrl;
                this.updateLogoPreview(dataUrl);
                this.updateCardLogo(dataUrl);
            }
        };
        reader.readAsDataURL(file);
    }

    updatePhotoPreview(dataUrl) {
        const preview = this.uploads.photoPreview;
        if (dataUrl) {
            preview.innerHTML = `<img src="${dataUrl}" alt="Profile">`;
            preview.classList.add('has-image');
        } else {
            preview.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                </svg>`;
            preview.classList.remove('has-image');
        }
    }

    updateLogoPreview(dataUrl) {
        const preview = this.uploads.logoPreview;
        if (dataUrl) {
            preview.innerHTML = `<img src="${dataUrl}" alt="Logo">`;
            preview.classList.add('has-image');
        } else {
            preview.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <path d="M9 12h6M12 9v6"/>
                </svg>`;
            preview.classList.remove('has-image');
        }
    }

    updateCardPhoto(dataUrl) {
        if (dataUrl) {
            this.card.photo.innerHTML = `<img src="${dataUrl}" alt="Profile">`;
        } else {
            this.card.photo.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                </svg>`;
        }
    }

    updateCardLogo(dataUrl) {
        if (dataUrl) {
            this.card.logo.innerHTML = `<img src="${dataUrl}" alt="Logo">`;
        } else {
            this.card.logo.innerHTML = '';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Style Management
    // ═══════════════════════════════════════════════════════════════

    setCardStyle(style) {
        this.state.cardStyle = style;

        // Update UI
        this.styleCards.forEach(card => {
            card.classList.toggle('active', card.dataset.style === style);
        });

        // Update card classes
        this.card.element.className = 'card';
        this.card.element.classList.add(`style-${style}`);
        this.card.element.classList.add(`font-${this.state.fontStyle}`);

        if (this.state.isFlipped) {
            this.card.element.classList.add('flipped');
        }
    }

    setAccentColor(color, swatch) {
        this.state.accentColor = color;

        // Update UI
        if (swatch) {
            this.colorSwatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
        }

        // Update CSS variable
        document.documentElement.style.setProperty('--accent', color);
        document.documentElement.style.setProperty('--card-accent', color);

        // Update custom color input
        if (this.customColorInput) {
            this.customColorInput.value = color;
        }
    }

    setFontStyle(font) {
        this.state.fontStyle = font;

        // Update UI
        this.fontOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.font === font);
        });

        // Update card class
        this.card.element.classList.remove('font-classic', 'font-modern', 'font-mono');
        this.card.element.classList.add(`font-${font}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // View Management
    // ═══════════════════════════════════════════════════════════════

    flipCard() {
        this.state.isFlipped = !this.state.isFlipped;
        this.card.element.classList.toggle('flipped', this.state.isFlipped);

        // Update view buttons
        this.viewButtons.forEach(btn => {
            const view = btn.dataset.view;
            const isActive = (view === 'back' && this.state.isFlipped) ||
                           (view === 'front' && !this.state.isFlipped);
            btn.classList.toggle('active', isActive);
        });
    }

    setView(view) {
        const shouldFlip = view === 'back';
        if (this.state.isFlipped !== shouldFlip) {
            this.flipCard();
        }
    }

    togglePreviewMode() {
        document.querySelector('.editor').classList.toggle('hidden');
        this.previewModeBtn.classList.toggle('active');
    }

    // ═══════════════════════════════════════════════════════════════
    // QR Code Generation
    // ═══════════════════════════════════════════════════════════════

    generateQRCode() {
        const qrContainer = this.card.qrCode;
        if (!qrContainer || typeof QRCode === 'undefined') return;

        qrContainer.innerHTML = '';

        const qrData = this.state.website || this.state.email
            ? (this.state.website
                ? (this.state.website.startsWith('http')
                    ? this.state.website
                    : `https://${this.state.website}`)
                : `mailto:${this.state.email}`)
            : window.location.href;

        try {
            QRCode.toCanvas(qrData, {
                width: 68,
                margin: 0,
                color: {
                    dark: '#1A1A1A',
                    light: '#FFFFFF'
                }
            }, (error, canvas) => {
                if (!error && canvas) {
                    qrContainer.appendChild(canvas);
                }
            });
        } catch (e) {
            console.log('QR generation error:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Sharing
    // ═══════════════════════════════════════════════════════════════

    generateShareLink() {
        const cardData = {
            n: this.state.fullName,
            t: this.state.jobTitle,
            c: this.state.company,
            e: this.state.email,
            p: this.state.phone,
            w: this.state.website,
            l: this.state.location,
            li: this.state.linkedin,
            tw: this.state.twitter,
            s: this.state.cardStyle,
            ac: this.state.accentColor,
            f: this.state.fontStyle
        };

        // Remove empty values
        Object.keys(cardData).forEach(key => {
            if (!cardData[key]) delete cardData[key];
        });

        const encoded = btoa(encodeURIComponent(JSON.stringify(cardData)));
        const shareUrl = `${window.location.origin}${window.location.pathname}?card=${encoded}`;

        this.shareUrl.value = shareUrl;
        return shareUrl;
    }

    copyShareLink() {
        const url = this.shareUrl.value || this.generateShareLink();
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Link copied!');
        });
    }

    shareVia(platform) {
        const url = this.shareUrl.value || this.generateShareLink();
        const name = this.state.fullName || 'My Business Card';
        const text = `Check out ${name}'s digital business card`;

        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ': ' + url)}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
                break;
            case 'sms':
                window.location.href = `sms:?body=${encodeURIComponent(text + ': ' + url)}`;
                break;
            case 'native':
                if (navigator.share) {
                    navigator.share({ title: name, text, url });
                } else {
                    this.copyShareLink();
                }
                break;
        }
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const cardData = params.get('card');

        if (cardData) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(cardData)));

                // Map short keys to full field names
                const mapping = {
                    n: 'fullName',
                    t: 'jobTitle',
                    c: 'company',
                    e: 'email',
                    p: 'phone',
                    w: 'website',
                    l: 'location',
                    li: 'linkedin',
                    tw: 'twitter',
                    s: 'cardStyle',
                    ac: 'accentColor',
                    f: 'fontStyle'
                };

                // Apply values
                Object.entries(decoded).forEach(([key, value]) => {
                    const fieldName = mapping[key];
                    if (fieldName && value) {
                        if (['cardStyle', 'accentColor', 'fontStyle'].includes(fieldName)) {
                            if (fieldName === 'cardStyle') this.setCardStyle(value);
                            if (fieldName === 'accentColor') this.setAccentColor(value, null);
                            if (fieldName === 'fontStyle') this.setFontStyle(value);
                        } else {
                            if (this.inputs[fieldName]) {
                                this.inputs[fieldName].value = value;
                            }
                            this.updateField(fieldName, value);
                        }
                    }
                });
            } catch (e) {
                console.log('Error parsing card data:', e);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // vCard Generation
    // ═══════════════════════════════════════════════════════════════

    generateVCard() {
        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${this.state.fullName || ''}`,
            `N:${this.formatName()}`,
            `TITLE:${this.state.jobTitle || ''}`,
            `ORG:${this.state.company || ''}`,
            `EMAIL:${this.state.email || ''}`,
            `TEL:${this.state.phone || ''}`,
            `URL:${this.state.website ? (this.state.website.startsWith('http') ? this.state.website : 'https://' + this.state.website) : ''}`,
            `ADR:;;${this.state.location || ''};;;;`,
        ];

        if (this.state.linkedin) {
            const linkedinUrl = this.state.linkedin.startsWith('http')
                ? this.state.linkedin
                : `https://linkedin.com/${this.state.linkedin}`;
            vcard.push(`X-SOCIALPROFILE;TYPE=linkedin:${linkedinUrl}`);
        }

        if (this.state.twitter) {
            const handle = this.state.twitter.replace('@', '');
            vcard.push(`X-SOCIALPROFILE;TYPE=twitter:https://twitter.com/${handle}`);
        }

        // Add photo if exists
        if (this.state.profilePhoto) {
            const base64Data = this.state.profilePhoto.split(',')[1];
            const mimeType = this.state.profilePhoto.split(';')[0].split(':')[1];
            vcard.push(`PHOTO;ENCODING=b;TYPE=${mimeType.split('/')[1].toUpperCase()}:${base64Data}`);
        }

        vcard.push('END:VCARD');

        const blob = new Blob([vcard.join('\r\n')], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(this.state.fullName || 'contact').replace(/\s+/g, '_')}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Contact saved!');
    }

    formatName() {
        const parts = (this.state.fullName || '').trim().split(' ');
        if (parts.length >= 2) {
            const lastName = parts.pop();
            const firstName = parts.join(' ');
            return `${lastName};${firstName};;;`;
        }
        return `${this.state.fullName || ''};;;;`;
    }

    // ═══════════════════════════════════════════════════════════════
    // Export
    // ═══════════════════════════════════════════════════════════════

    async exportCard() {
        if (typeof html2canvas === 'undefined') {
            this.showToast('Export library not loaded');
            return;
        }

        const wasFlipped = this.state.isFlipped;
        const cardElement = this.card.front;

        // Export front
        if (wasFlipped) {
            this.card.element.classList.remove('flipped');
            await new Promise(r => setTimeout(r, 800));
        }

        try {
            const frontCanvas = await html2canvas(cardElement, {
                scale: 3,
                backgroundColor: null,
                useCORS: true,
                logging: false
            });

            this.downloadCanvas(frontCanvas, `${this.state.fullName || 'card'}_front.png`);

            // Export back
            this.card.element.classList.add('flipped');
            await new Promise(r => setTimeout(r, 800));

            const backCanvas = await html2canvas(this.card.back, {
                scale: 3,
                backgroundColor: null,
                useCORS: true,
                logging: false
            });

            this.downloadCanvas(backCanvas, `${this.state.fullName || 'card'}_back.png`);

            // Restore original state
            if (!wasFlipped) {
                this.card.element.classList.remove('flipped');
            }

            this.showToast('Cards exported!');
        } catch (e) {
            console.error('Export error:', e);
            this.showToast('Export failed');
        }
    }

    downloadCanvas(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename.replace(/\s+/g, '_');
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ═══════════════════════════════════════════════════════════════
    // Toast Notification
    // ═══════════════════════════════════════════════════════════════

    showToast(message) {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        // Create toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        const isDark = this.state.theme === 'dark';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: ${isDark ? '#2C2C30' : '#1A1A1A'};
            color: ${isDark ? '#F5F5F7' : 'white'};
            padding: 12px 24px;
            border-radius: 10px;
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            box-shadow: 0 8px 32px rgba(0,0,0,${isDark ? '0.4' : '0.2'});
            border: 1px solid ${isDark ? '#3C3C40' : 'transparent'};
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cardCraft = new CardCraft();
});
