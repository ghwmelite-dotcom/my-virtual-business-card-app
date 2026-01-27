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
            theme: 'light',

            // AI Features
            suggestedColors: [],
            currentLogoSVG: null,
            logoGeneratorSettings: {
                style: 'circle',
                bgColor: '#B87333',
                textColor: '#FFFFFF',
                initials: 'JC'
            },
            isEnhancingPhoto: false
        };

        this.colorThief = null;
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

        // AI Feature Elements
        // Smart Color Extraction
        this.suggestedColorsSection = document.getElementById('suggestedColorsSection');
        this.suggestedColorsRow = document.getElementById('suggestedColorsRow');

        // Logo Generator Modal
        this.logoGeneratorModal = document.getElementById('logoGeneratorModal');
        this.generateLogoBtn = document.getElementById('generateLogoBtn');
        this.logoModalClose = document.getElementById('logoModalClose');
        this.logoModalCancel = document.getElementById('logoModalCancel');
        this.useGeneratedLogoBtn = document.getElementById('useGeneratedLogo');
        this.logoStyleOptions = document.querySelectorAll('.logo-style-option');
        this.logoBgColorInput = document.getElementById('logoBgColor');
        this.logoTextColorInput = document.getElementById('logoTextColor');
        this.logoBgColorValue = document.getElementById('logoBgColorValue');
        this.logoTextColorValue = document.getElementById('logoTextColorValue');
        this.logoInitialsInput = document.getElementById('logoInitials');
        this.generatedLogoPreview = document.getElementById('generatedLogoPreview');

        // AI Headshot Enhancement
        this.aiEnhanceBtn = document.getElementById('aiEnhanceBtn');

        // AI Tagline Generator
        this.industrySelect = document.getElementById('industrySelect');
        this.generateTaglineBtn = document.getElementById('generateTaglineBtn');
        this.taglineResults = document.getElementById('taglineResults');
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

        // ═══════════════════════════════════════════════════════════════
        // AI Feature Event Listeners
        // ═══════════════════════════════════════════════════════════════

        // Logo Generator Modal
        if (this.generateLogoBtn) {
            this.generateLogoBtn.addEventListener('click', () => this.openLogoGenerator());
        }

        if (this.logoModalClose) {
            this.logoModalClose.addEventListener('click', () => this.closeLogoGenerator());
        }

        if (this.logoModalCancel) {
            this.logoModalCancel.addEventListener('click', () => this.closeLogoGenerator());
        }

        if (this.logoGeneratorModal) {
            this.logoGeneratorModal.addEventListener('click', (e) => {
                if (e.target === this.logoGeneratorModal) {
                    this.closeLogoGenerator();
                }
            });
        }

        if (this.useGeneratedLogoBtn) {
            this.useGeneratedLogoBtn.addEventListener('click', () => this.useGeneratedLogo());
        }

        // Logo style options
        this.logoStyleOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.logoStyleOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.state.logoGeneratorSettings.style = option.dataset.logoStyle;
                this.updateLogoGeneratorPreview();
            });
        });

        // Logo color inputs
        if (this.logoBgColorInput) {
            this.logoBgColorInput.addEventListener('input', (e) => {
                this.state.logoGeneratorSettings.bgColor = e.target.value;
                if (this.logoBgColorValue) {
                    this.logoBgColorValue.textContent = e.target.value.toUpperCase();
                }
                this.updateLogoGeneratorPreview();
            });
        }

        if (this.logoTextColorInput) {
            this.logoTextColorInput.addEventListener('input', (e) => {
                this.state.logoGeneratorSettings.textColor = e.target.value;
                if (this.logoTextColorValue) {
                    this.logoTextColorValue.textContent = e.target.value.toUpperCase();
                }
                this.updateLogoGeneratorPreview();
            });
        }

        // Logo initials input
        if (this.logoInitialsInput) {
            this.logoInitialsInput.addEventListener('input', (e) => {
                this.state.logoGeneratorSettings.initials = e.target.value.toUpperCase();
                this.updateLogoGeneratorPreview();
            });
        }

        // AI Headshot Enhancement
        if (this.aiEnhanceBtn) {
            this.aiEnhanceBtn.addEventListener('click', () => this.enhanceHeadshot());
        }

        // AI Tagline Generator
        if (this.industrySelect) {
            this.industrySelect.addEventListener('change', () => this.updateTaglineButtonState());
        }

        // Also update tagline button when job title changes
        if (this.inputs.jobTitle) {
            this.inputs.jobTitle.addEventListener('input', () => this.updateTaglineButtonState());
        }

        if (this.generateTaglineBtn) {
            this.generateTaglineBtn.addEventListener('click', () => this.generateTaglines());
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

                // Enable AI Enhance button
                if (this.aiEnhanceBtn) {
                    this.aiEnhanceBtn.disabled = false;
                    this.aiEnhanceBtn.title = 'Remove background from photo';
                }
            } else {
                this.state.companyLogo = dataUrl;
                this.updateLogoPreview(dataUrl);
                this.updateCardLogo(dataUrl);

                // Extract colors from logo for AI color suggestions
                this.extractColorsFromLogo(dataUrl);
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
    // AI Feature 1: Smart Color Extraction
    // ═══════════════════════════════════════════════════════════════

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    extractColorsFromLogo(imageDataUrl) {
        // Initialize Color Thief if not already done
        if (!this.colorThief && typeof ColorThief !== 'undefined') {
            this.colorThief = new ColorThief();
        }

        if (!this.colorThief) {
            console.log('Color Thief library not loaded');
            return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            try {
                // Get palette of 6 colors
                const palette = this.colorThief.getPalette(img, 6);

                if (palette && palette.length > 0) {
                    this.state.suggestedColors = palette.map(rgb => this.rgbToHex(rgb[0], rgb[1], rgb[2]));
                    this.displaySuggestedColors();
                }
            } catch (e) {
                console.log('Error extracting colors:', e);
            }
        };

        img.src = imageDataUrl;
    }

    displaySuggestedColors() {
        if (!this.suggestedColorsSection || !this.suggestedColorsRow) return;

        // Show the section
        this.suggestedColorsSection.style.display = 'block';

        // Clear existing colors
        this.suggestedColorsRow.innerHTML = '';

        // Add color swatches
        this.state.suggestedColors.forEach(color => {
            const swatch = document.createElement('button');
            swatch.className = 'suggested-color-swatch';
            swatch.style.cssText = `
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 2px solid transparent;
                background-color: ${color};
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            `;
            swatch.dataset.color = color;
            swatch.title = color;

            swatch.addEventListener('click', () => {
                // Remove active state from all suggested swatches
                this.suggestedColorsRow.querySelectorAll('.suggested-color-swatch').forEach(s => {
                    s.style.borderColor = 'transparent';
                    s.style.transform = 'scale(1)';
                });
                // Remove active from preset swatches
                this.colorSwatches.forEach(s => s.classList.remove('active'));

                // Add active state
                swatch.style.borderColor = this.state.theme === 'dark' ? '#fff' : '#1A1A1A';
                swatch.style.transform = 'scale(1.1)';

                // Apply the color
                this.setAccentColor(color, null);
            });

            swatch.addEventListener('mouseenter', () => {
                if (swatch.style.borderColor === 'transparent') {
                    swatch.style.transform = 'scale(1.05)';
                }
            });

            swatch.addEventListener('mouseleave', () => {
                if (swatch.style.borderColor === 'transparent') {
                    swatch.style.transform = 'scale(1)';
                }
            });

            this.suggestedColorsRow.appendChild(swatch);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // AI Feature 2: Logo Generator
    // ═══════════════════════════════════════════════════════════════

    openLogoGenerator() {
        if (!this.logoGeneratorModal) return;

        // Auto-fill initials from company name if available
        if (this.state.company) {
            const initials = this.getInitials(this.state.company);
            this.state.logoGeneratorSettings.initials = initials;
            if (this.logoInitialsInput) {
                this.logoInitialsInput.value = initials;
            }
        }

        // Sync colors with current accent color
        this.state.logoGeneratorSettings.bgColor = this.state.accentColor;
        if (this.logoBgColorInput) {
            this.logoBgColorInput.value = this.state.accentColor;
        }
        if (this.logoBgColorValue) {
            this.logoBgColorValue.textContent = this.state.accentColor.toUpperCase();
        }

        this.updateLogoGeneratorPreview();
        this.logoGeneratorModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeLogoGenerator() {
        if (!this.logoGeneratorModal) return;
        this.logoGeneratorModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    getInitials(text) {
        if (!text) return 'AB';
        const words = text.trim().split(/\s+/);
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }
        return (words[0][0] + words[1][0]).toUpperCase();
    }

    generateLogoSVG() {
        const { style, bgColor, textColor, initials } = this.state.logoGeneratorSettings;
        const displayInitials = initials || 'AB';
        const size = 100;

        let shapeSVG = '';
        let textY = '53';

        switch (style) {
            case 'circle':
                shapeSVG = `<circle cx="50" cy="50" r="48" fill="${bgColor}"/>`;
                break;
            case 'square':
                shapeSVG = `<rect x="2" y="2" width="96" height="96" fill="${bgColor}"/>`;
                break;
            case 'rounded':
                shapeSVG = `<rect x="2" y="2" width="96" height="96" rx="16" fill="${bgColor}"/>`;
                break;
            case 'minimal':
                // No background, just text with underline accent
                shapeSVG = `<line x1="20" y1="70" x2="80" y2="70" stroke="${bgColor}" stroke-width="4" stroke-linecap="round"/>`;
                textY = '58';
                break;
        }

        const textColor2 = style === 'minimal' ? bgColor : textColor;
        const fontSize = displayInitials.length === 1 ? 48 : 36;

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
                ${shapeSVG}
                <text x="50" y="${textY}"
                    font-family="'Satoshi', 'SF Pro Display', -apple-system, sans-serif"
                    font-size="${fontSize}"
                    font-weight="600"
                    fill="${textColor2}"
                    text-anchor="middle"
                    dominant-baseline="middle">${displayInitials}</text>
            </svg>
        `;

        this.state.currentLogoSVG = svg;
        return svg;
    }

    updateLogoGeneratorPreview() {
        if (!this.generatedLogoPreview) return;

        const { style, bgColor, textColor, initials } = this.state.logoGeneratorSettings;
        const displayInitials = initials || 'AB';

        // Update preview styling based on style
        this.generatedLogoPreview.innerHTML = '';

        const previewInitials = document.createElement('span');
        previewInitials.className = 'logo-preview-initials';
        previewInitials.textContent = displayInitials;

        // Reset styles
        this.generatedLogoPreview.style.cssText = `
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Satoshi', sans-serif;
            font-weight: 600;
            font-size: ${displayInitials.length === 1 ? '36px' : '28px'};
            transition: all 0.3s ease;
        `;

        switch (style) {
            case 'circle':
                this.generatedLogoPreview.style.borderRadius = '50%';
                this.generatedLogoPreview.style.backgroundColor = bgColor;
                previewInitials.style.color = textColor;
                break;
            case 'square':
                this.generatedLogoPreview.style.borderRadius = '0';
                this.generatedLogoPreview.style.backgroundColor = bgColor;
                previewInitials.style.color = textColor;
                break;
            case 'rounded':
                this.generatedLogoPreview.style.borderRadius = '16px';
                this.generatedLogoPreview.style.backgroundColor = bgColor;
                previewInitials.style.color = textColor;
                break;
            case 'minimal':
                this.generatedLogoPreview.style.borderRadius = '0';
                this.generatedLogoPreview.style.backgroundColor = 'transparent';
                this.generatedLogoPreview.style.borderBottom = `4px solid ${bgColor}`;
                previewInitials.style.color = bgColor;
                break;
        }

        this.generatedLogoPreview.appendChild(previewInitials);
    }

    svgToDataURL(svgString) {
        const encoded = encodeURIComponent(svgString)
            .replace(/'/g, '%27')
            .replace(/"/g, '%22');
        return `data:image/svg+xml,${encoded}`;
    }

    useGeneratedLogo() {
        const svg = this.generateLogoSVG();
        const dataUrl = this.svgToDataURL(svg);

        // Update state and previews
        this.state.companyLogo = dataUrl;
        this.updateLogoPreview(dataUrl);
        this.updateCardLogo(dataUrl);

        // Close modal
        this.closeLogoGenerator();
        this.showToast('Logo applied!');
    }

    // ═══════════════════════════════════════════════════════════════
    // AI Feature 3: Headshot Enhancement (Background Removal)
    // ═══════════════════════════════════════════════════════════════

    async enhanceHeadshot() {
        if (!this.state.profilePhoto) {
            this.showToast('Please upload a photo first');
            return;
        }

        if (this.state.isEnhancingPhoto) {
            return;
        }

        // Check if library is loaded
        if (typeof imglyRemoveBackground === 'undefined') {
            this.showToast('Enhancement library not loaded');
            return;
        }

        this.state.isEnhancingPhoto = true;

        // Update button to show processing state
        if (this.aiEnhanceBtn) {
            this.aiEnhanceBtn.disabled = true;
            this.aiEnhanceBtn.innerHTML = `
                <span class="btn-spinner-inline"></span>
                <span>Processing...</span>
            `;
            this.aiEnhanceBtn.style.cssText = `
                opacity: 0.7;
                cursor: wait;
            `;
        }

        try {
            // Convert data URL to blob for the library
            const response = await fetch(this.state.profilePhoto);
            const blob = await response.blob();

            // Remove background using imgly
            const resultBlob = await imglyRemoveBackground(blob, {
                progress: (key, current, total) => {
                    // Could show progress here if needed
                    console.log(`Processing: ${key} - ${current}/${total}`);
                }
            });

            // Convert result blob to data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const enhancedDataUrl = e.target.result;

                // Update state and previews
                this.state.profilePhoto = enhancedDataUrl;
                this.updatePhotoPreview(enhancedDataUrl);
                this.updateCardPhoto(enhancedDataUrl);

                this.showToast('Photo enhanced!');
                this.resetEnhanceButton();
            };
            reader.readAsDataURL(resultBlob);

        } catch (error) {
            console.error('Enhancement error:', error);
            this.showToast('Enhancement failed. Try a different photo.');
            this.resetEnhanceButton();
        }
    }

    resetEnhanceButton() {
        this.state.isEnhancingPhoto = false;

        if (this.aiEnhanceBtn) {
            this.aiEnhanceBtn.disabled = !this.state.profilePhoto;
            this.aiEnhanceBtn.innerHTML = `
                <svg class="ai-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M10 2l1.5 3.5L15 7l-3.5 1.5L10 12l-1.5-3.5L5 7l3.5-1.5L10 2z"/>
                    <path d="M15 12l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/>
                    <path d="M5 14l.5 1.5L7 16l-1.5.5L5 18l-.5-1.5L3 16l1.5-.5L5 14z"/>
                </svg>
                <span>AI Enhance</span>
            `;
            this.aiEnhanceBtn.style.cssText = '';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AI Feature 4: Tagline Generator
    // ═══════════════════════════════════════════════════════════════

    updateTaglineButtonState() {
        if (!this.generateTaglineBtn) return;

        const hasTitle = this.state.jobTitle && this.state.jobTitle.trim().length > 0;
        const hasIndustry = this.industrySelect && this.industrySelect.value;

        this.generateTaglineBtn.disabled = !(hasTitle && hasIndustry);
    }

    async generateTaglines() {
        const title = this.state.jobTitle;
        const industry = this.industrySelect ? this.industrySelect.value : '';

        if (!title || !industry) {
            this.showToast('Please enter a job title and select an industry');
            return;
        }

        // Show loading state
        if (this.generateTaglineBtn) {
            this.generateTaglineBtn.classList.add('loading');
            this.generateTaglineBtn.disabled = true;
        }

        // Show skeleton loading in results
        this.showTaglineSkeletons();

        try {
            // Call Cloudflare AI API
            const response = await fetch('/api/generate-tagline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobTitle: title,
                    industry: industry,
                    tone: 'professional'
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (data.success && data.taglines && data.taglines.length > 0) {
                this.displayTaglines(data.taglines);
            } else {
                // Fallback to template-based if AI fails
                const fallbackTaglines = this.createFallbackTaglines(title, industry);
                this.displayTaglines(fallbackTaglines);
            }
        } catch (error) {
            console.error('AI Tagline Error:', error);
            // Fallback to template-based generation
            const fallbackTaglines = this.createFallbackTaglines(title, industry);
            this.displayTaglines(fallbackTaglines);
        } finally {
            if (this.generateTaglineBtn) {
                this.generateTaglineBtn.classList.remove('loading');
                this.generateTaglineBtn.disabled = false;
            }
        }
    }

    showTaglineSkeletons() {
        if (!this.taglineResults) return;

        this.taglineResults.innerHTML = '';
        this.taglineResults.style.display = 'block';

        for (let i = 0; i < 4; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'tagline-skeleton';
            skeleton.style.cssText = `
                height: 44px;
                background: linear-gradient(90deg,
                    ${this.state.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} 25%,
                    ${this.state.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} 50%,
                    ${this.state.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} 75%
                );
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 8px;
                margin-bottom: 8px;
            `;
            this.taglineResults.appendChild(skeleton);
        }

        // Add shimmer animation if not present
        if (!document.getElementById('shimmer-animation')) {
            const style = document.createElement('style');
            style.id = 'shimmer-animation';
            style.textContent = `
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    createFallbackTaglines(title, industry) {
        // Fallback template-based taglines when AI is unavailable
        const industryTerms = {
            technology: ['innovation', 'digital transformation', 'tech solutions', 'the digital age'],
            finance: ['financial growth', 'wealth management', 'fiscal excellence', 'financial futures'],
            healthcare: ['patient care', 'health outcomes', 'medical excellence', 'healthcare innovation'],
            marketing: ['brand growth', 'market impact', 'audience engagement', 'brand storytelling'],
            design: ['creative solutions', 'visual excellence', 'design thinking', 'aesthetic innovation'],
            education: ['learning outcomes', 'educational excellence', 'student success', 'knowledge sharing'],
            legal: ['legal excellence', 'justice', 'legal solutions', 'client advocacy'],
            other: ['excellence', 'success', 'innovation', 'growth']
        };

        const terms = industryTerms[industry] || industryTerms.other;
        const industryCapitalized = industry.charAt(0).toUpperCase() + industry.slice(1);

        const templates = [
            `${title} | Transforming ${terms[0]}`,
            `Innovative ${title} | ${industryCapitalized} Expert`,
            `${title} driving ${terms[1]}`,
            `${title} | Building the future of ${industryCapitalized.toLowerCase()}`
        ];

        return templates;
    }

    displayTaglines(taglines) {
        if (!this.taglineResults) return;

        this.taglineResults.innerHTML = '';
        this.taglineResults.style.display = 'block';

        taglines.forEach((tagline, index) => {
            const card = document.createElement('div');
            card.className = 'tagline-card';
            card.style.cssText = `
                padding: 12px 16px;
                background: ${this.state.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'};
                border: 1px solid ${this.state.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-bottom: 8px;
                font-size: 0.875rem;
                color: ${this.state.theme === 'dark' ? '#E5E5E7' : '#1A1A1A'};
                animation: fadeInUp 0.3s ease forwards;
                animation-delay: ${index * 0.1}s;
                opacity: 0;
            `;

            card.textContent = tagline;

            card.addEventListener('mouseenter', () => {
                card.style.background = this.state.theme === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)';
                card.style.borderColor = this.state.accentColor;
            });

            card.addEventListener('mouseleave', () => {
                card.style.background = this.state.theme === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.02)';
                card.style.borderColor = this.state.theme === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.08)';
            });

            card.addEventListener('click', () => {
                this.copyTagline(tagline, card);
            });

            this.taglineResults.appendChild(card);
        });

        // Add animation keyframes if not already present
        if (!document.getElementById('tagline-animations')) {
            const style = document.createElement('style');
            style.id = 'tagline-animations';
            style.textContent = `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    copyTagline(tagline, cardElement) {
        navigator.clipboard.writeText(tagline).then(() => {
            // Visual feedback
            const originalBg = cardElement.style.background;
            cardElement.style.background = this.state.accentColor;
            cardElement.style.color = '#fff';

            setTimeout(() => {
                cardElement.style.background = originalBg;
                cardElement.style.color = this.state.theme === 'dark' ? '#E5E5E7' : '#1A1A1A';
            }, 300);

            this.showToast('Tagline copied!');
        });
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
