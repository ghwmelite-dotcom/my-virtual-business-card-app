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
            textColor: 'auto',

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
            isEnhancingPhoto: false,

            // Personas
            currentPersonaId: 'default',
            personas: {},

            // Video
            videoData: null,
            isRecording: false,
            mediaRecorder: null,

            // Publishing
            cardId: null,
            isPublished: false,
            publishedUrl: null,

            // Meeting scheduler
            schedulerUrl: '',
            enableScheduler: false,

            // Follow-up
            enableFollowUp: false,

            // Bio
            selectedTone: 'professional',
            generatedBio: null
        };

        this.colorThief = null;

        // Style Templates
        this.templates = {
            'finance-pro': {
                cardStyle: 'dark',
                accentColor: '#D4AF37',
                fontStyle: 'modern',
                textColor: 'auto'
            },
            'minimalist': {
                cardStyle: 'minimal',
                accentColor: '#1A1A1A',
                fontStyle: 'classic',
                textColor: 'auto'
            },
            'executive': {
                cardStyle: 'light',
                accentColor: '#1E3A5F',
                fontStyle: 'classic',
                textColor: 'auto'
            },
            'bold-modern': {
                cardStyle: 'gradient',
                accentColor: '#FFFFFF',
                fontStyle: 'bold',
                textColor: '#FFFFFF'
            },
            'nature': {
                cardStyle: 'light',
                accentColor: '#2D5A4A',
                fontStyle: 'elegant',
                textColor: 'auto'
            },
            'dark-luxe': {
                cardStyle: 'dark',
                accentColor: '#6B4E71',
                fontStyle: 'elegant',
                textColor: 'auto'
            }
        };

        this.init();
    }

    init() {
        this.initTheme();
        this.bindElements();
        this.bindEvents();
        this.initQRCode();

        // Check if we're viewing a shared card
        if (this.checkViewMode()) {
            return; // Don't load other data in view mode
        }

        this.loadFromCloud(); // Try cloud first
        this.loadFromURL();
        this.generateQRCode();
    }

    // ═══════════════════════════════════════════════════════════════
    // View Mode (Shared Cards)
    // ═══════════════════════════════════════════════════════════════

    checkViewMode() {
        const params = new URLSearchParams(window.location.search);
        const viewCardId = params.get('view');

        if (viewCardId) {
            this.enterViewMode(viewCardId);
            return true;
        }
        return false;
    }

    async enterViewMode(cardId) {
        // Add view-mode class to show watermark and hide editor
        document.body.classList.add('view-mode');

        // Update watermark link to point to home
        const watermark = document.getElementById('cardcraftWatermark');
        if (watermark) {
            watermark.href = window.location.origin;
        }

        try {
            // Fetch card data
            const response = await fetch(`/api/get-card?id=${cardId}`);
            const result = await response.json();

            if (result.success && result.card) {
                this.applyCardData(result.card);
                this.generateQRCode();

                // Update page title
                if (result.card.fullName) {
                    document.title = `${result.card.fullName} — CardCraft`;
                }
            } else {
                this.showCardNotFound();
            }
        } catch (error) {
            console.error('[CardCraft] Error loading shared card:', error);
            this.showCardNotFound();
        }
    }

    showCardNotFound() {
        const cardContainer = document.getElementById('cardContainer');
        if (cardContainer) {
            cardContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 40px; color: var(--text-secondary);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5;">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4M12 16h.01"/>
                    </svg>
                    <h3 style="margin: 0 0 8px; font-size: 1.1rem; color: var(--text);">Card Not Found</h3>
                    <p style="margin: 0; font-size: 0.9rem;">This card may have been deleted or the link is incorrect.</p>
                </div>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Cloud Save/Load (Cloudflare KV)
    // ═══════════════════════════════════════════════════════════════

    async loadFromCloud() {
        // Check if we have a draft ID saved
        const draftId = localStorage.getItem('cardcraft-draft-id');
        if (!draftId) {
            console.log('[CardCraft] No cloud draft ID found');
            return;
        }

        console.log('[CardCraft] Loading from cloud, draft ID:', draftId);

        try {
            const response = await fetch(`/api/load-draft?id=${draftId}`);
            const result = await response.json();

            if (result.success && result.draft) {
                this.applyCardData(result.draft);
                console.log('[CardCraft] Cloud data loaded successfully');
                this.showToast('Card restored from cloud');
            } else {
                console.log('[CardCraft] No cloud draft found');
            }
        } catch (error) {
            console.error('[CardCraft] Failed to load from cloud:', error);
        }
    }

    async saveToCloud() {
        const saveBtn = document.getElementById('saveProgressBtn');
        const saveText = saveBtn?.querySelector('.save-text');

        if (saveBtn) {
            saveBtn.classList.add('saving');
            if (saveText) saveText.textContent = 'Saving';
        }

        try {
            const cardData = this.getAllCardData();
            const existingDraftId = localStorage.getItem('cardcraft-draft-id');

            const response = await fetch('/api/save-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    draftId: existingDraftId,
                    cardData
                })
            });

            const result = await response.json();

            if (result.success) {
                // Store the draft ID for future loads
                localStorage.setItem('cardcraft-draft-id', result.draftId);
                console.log('[CardCraft] Saved to cloud, draft ID:', result.draftId);

                if (saveBtn) {
                    saveBtn.classList.remove('saving');
                    saveBtn.classList.add('saved');
                    if (saveText) saveText.textContent = 'Saved!';

                    setTimeout(() => {
                        saveBtn.classList.remove('saved');
                        if (saveText) saveText.textContent = 'Save';
                    }, 2000);
                }

                this.showToast('Saved to cloud!');
            } else {
                throw new Error(result.error || 'Save failed');
            }
        } catch (error) {
            console.error('[CardCraft] Cloud save failed:', error);
            if (saveBtn) {
                saveBtn.classList.remove('saving');
                if (saveText) saveText.textContent = 'Save';
            }
            this.showToast('Save failed - try again');
        }
    }

    getAllCardData() {
        return {
            fullName: this.state.fullName,
            jobTitle: this.state.jobTitle,
            company: this.state.company,
            email: this.state.email,
            phone: this.state.phone,
            website: this.state.website,
            location: this.state.location,
            linkedin: this.state.linkedin,
            twitter: this.state.twitter,
            profilePhoto: this.state.profilePhoto,
            companyLogo: this.state.companyLogo,
            cardStyle: this.state.cardStyle,
            accentColor: this.state.accentColor,
            fontStyle: this.state.fontStyle,
            textColor: this.state.textColor,
            schedulerUrl: this.state.schedulerUrl,
            enableScheduler: this.state.enableScheduler,
            enableFollowUp: this.state.enableFollowUp,
            selectedTone: this.state.selectedTone,
            generatedBio: this.state.generatedBio,
            videoData: this.state.videoData
        };
    }

    applyCardData(data) {
        if (!data) return;

        // Apply text fields
        const textFields = ['fullName', 'jobTitle', 'company', 'email', 'phone', 'website', 'location', 'linkedin', 'twitter'];
        textFields.forEach(field => {
            if (data[field]) {
                if (this.inputs[field]) {
                    this.inputs[field].value = data[field];
                }
                this.state[field] = data[field];
                this.updateField(field, data[field]);
            }
        });

        // Apply styles
        if (data.cardStyle) this.setCardStyle(data.cardStyle);
        if (data.accentColor) this.setAccentColor(data.accentColor, null);
        if (data.fontStyle) this.setFontStyle(data.fontStyle);
        if (data.textColor) this.setTextColor(data.textColor, null);

        // Apply images
        if (data.profilePhoto) {
            this.state.profilePhoto = data.profilePhoto;
            this.updatePhotoPreview(data.profilePhoto);
            this.updateCardPhoto(data.profilePhoto);
        }
        if (data.companyLogo) {
            this.state.companyLogo = data.companyLogo;
            this.updateLogoPreview(data.companyLogo);
            this.updateCardLogo(data.companyLogo);
        }

        // Apply other settings
        if (data.schedulerUrl) this.state.schedulerUrl = data.schedulerUrl;
        if (data.enableScheduler) this.state.enableScheduler = data.enableScheduler;
        if (data.enableFollowUp) this.state.enableFollowUp = data.enableFollowUp;
        if (data.selectedTone) this.state.selectedTone = data.selectedTone;
        if (data.generatedBio) this.state.generatedBio = data.generatedBio;
    }

    // ═══════════════════════════════════════════════════════════════
    // Local Data Persistence (localStorage backup)
    // ═══════════════════════════════════════════════════════════════

    setupAutoSave() {
        // This is now just for localStorage backup, cloud save is manual
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveCardData();
            }
        });
    }

    saveCardData() {
        // Don't save while loading
        if (this._isLoading) {
            console.log('[CardCraft] Skipping save (loading in progress)');
            return;
        }

        try {
            const dataToSave = {
                fullName: this.state.fullName,
                jobTitle: this.state.jobTitle,
                company: this.state.company,
                email: this.state.email,
                phone: this.state.phone,
                website: this.state.website,
                location: this.state.location,
                linkedin: this.state.linkedin,
                twitter: this.state.twitter,
                profilePhoto: this.state.profilePhoto,
                companyLogo: this.state.companyLogo,
                cardStyle: this.state.cardStyle,
                accentColor: this.state.accentColor,
                fontStyle: this.state.fontStyle,
                textColor: this.state.textColor,
                schedulerUrl: this.state.schedulerUrl,
                enableScheduler: this.state.enableScheduler,
                enableFollowUp: this.state.enableFollowUp,
                selectedTone: this.state.selectedTone,
                generatedBio: this.state.generatedBio,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('cardcraft-data', JSON.stringify(dataToSave));
            console.log('[CardCraft] Data saved successfully, fields:',
                Object.keys(dataToSave).filter(k => dataToSave[k] && k !== 'savedAt').length);
        } catch (e) {
            console.error('[CardCraft] Failed to save card data:', e);
        }
    }

    loadSavedData() {
        console.log('[CardCraft] loadSavedData called');

        // Test localStorage availability first
        try {
            localStorage.setItem('cardcraft-test', 'test');
            localStorage.removeItem('cardcraft-test');
            console.log('[CardCraft] localStorage is available');
        } catch (e) {
            console.error('[CardCraft] localStorage NOT available:', e);
            return;
        }

        try {
            const saved = localStorage.getItem('cardcraft-data');
            console.log('[CardCraft] Retrieved from storage:', saved ? 'data found (' + saved.length + ' chars)' : 'null/empty');

            if (!saved) {
                console.log('[CardCraft] No saved card data found - this is normal for first visit');
                return;
            }

            const data = JSON.parse(saved);
            console.log('[CardCraft] Parsed data successfully');
            console.log('[CardCraft] savedAt:', data.savedAt);
            console.log('[CardCraft] Fields with data:', Object.keys(data).filter(k => data[k] && k !== 'savedAt').join(', '));

            // Track if we loaded any data
            let loadedFields = 0;

            // IMPORTANT: Set loading flag to prevent saves during restore
            this._isLoading = true;

            // Load text fields
            const textFields = ['fullName', 'jobTitle', 'company', 'email', 'phone', 'website', 'location', 'linkedin', 'twitter'];
            textFields.forEach(field => {
                if (data[field] && this.inputs[field]) {
                    this.inputs[field].value = data[field];
                    this.state[field] = data[field];
                    loadedFields++;
                }
            });

            // Update card display
            textFields.forEach(field => {
                if (data[field]) {
                    this.updateField(field, data[field]);
                }
            });

            // Load style settings
            if (data.cardStyle) this.setCardStyle(data.cardStyle);
            if (data.accentColor) this.setAccentColor(data.accentColor, null);
            if (data.fontStyle) this.setFontStyle(data.fontStyle);
            if (data.textColor) this.setTextColor(data.textColor, null);

            // Load images
            if (data.profilePhoto) {
                this.state.profilePhoto = data.profilePhoto;
                this.updatePhotoPreview(data.profilePhoto);
                this.updateCardPhoto(data.profilePhoto);
            }
            if (data.companyLogo) {
                this.state.companyLogo = data.companyLogo;
                this.updateLogoPreview(data.companyLogo);
                this.updateCardLogo(data.companyLogo);
            }

            // Load other settings
            if (data.schedulerUrl) this.state.schedulerUrl = data.schedulerUrl;
            if (data.enableScheduler) this.state.enableScheduler = data.enableScheduler;
            if (data.enableFollowUp) this.state.enableFollowUp = data.enableFollowUp;
            if (data.selectedTone) this.state.selectedTone = data.selectedTone;
            if (data.generatedBio) this.state.generatedBio = data.generatedBio;

            // IMPORTANT: Only now allow saves again
            this._isLoading = false;

            console.log('[CardCraft] Loaded saved card data:', loadedFields, 'fields restored');

            // Show restore notification if we loaded meaningful data
            if (loadedFields > 0) {
                setTimeout(() => {
                    this.showToast('Card data restored');
                }, 500);
            }
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
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
        this.textColorSwatches = document.querySelectorAll('.text-color-swatch');
        this.customTextColorInput = document.getElementById('customTextColor');

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

        // AI Bio Generator
        this.generateBioBtn = document.getElementById('generateBioBtn');
        this.bioResult = document.getElementById('bioResult');
        this.toneBtns = document.querySelectorAll('.tone-btn');

        // Persona Selector
        this.personaSelector = document.getElementById('personaSelector');
        this.personaTrigger = document.getElementById('personaTrigger');
        this.personaDropdown = document.getElementById('personaDropdown');
        this.personaList = document.getElementById('personaList');
        this.newPersonaBtn = document.getElementById('newPersonaBtn');
        this.currentPersonaName = document.getElementById('currentPersonaName');

        // Video
        this.videoUpload = document.getElementById('videoUpload');
        this.videoInput = document.getElementById('videoInput');
        this.videoPreview = document.getElementById('videoPreview');
        this.recordVideoBtn = document.getElementById('recordVideoBtn');
        this.videoPlayBtn = document.getElementById('videoPlayBtn');
        this.videoModal = document.getElementById('videoModal');
        this.videoModalClose = document.getElementById('videoModalClose');
        this.videoPlayer = document.getElementById('videoPlayer');

        // Publishing
        this.publishCardBtn = document.getElementById('publishCardBtn');
        this.publishStatus = document.getElementById('publishStatus');
        this.permanentUrl = document.getElementById('permanentUrl');
        this.publishedUrl = document.getElementById('publishedUrl');
        this.copyPublishedUrl = document.getElementById('copyPublishedUrl');

        // Wallet
        this.addToAppleWallet = document.getElementById('addToAppleWallet');
        this.addToGoogleWallet = document.getElementById('addToGoogleWallet');

        // Meeting Scheduler
        this.schedulerUrlInput = document.getElementById('schedulerUrl');
        this.enableSchedulerCheckbox = document.getElementById('enableScheduler');
        this.meetingRow = document.getElementById('meetingRow');
        this.meetingModal = document.getElementById('meetingModal');
        this.meetingModalClose = document.getElementById('meetingModalClose');
        this.meetingModalCancel = document.getElementById('meetingModalCancel');
        this.submitMeeting = document.getElementById('submitMeeting');

        // Follow-up / Connect
        this.enableFollowUpCheckbox = document.getElementById('enableFollowUp');
        this.connectModal = document.getElementById('connectModal');
        this.connectModalClose = document.getElementById('connectModalClose');
        this.connectModalCancel = document.getElementById('connectModalCancel');
        this.submitConnect = document.getElementById('submitConnect');

        // Analytics
        this.analyticsPlaceholder = document.getElementById('analyticsPlaceholder');
        this.analyticsContent = document.getElementById('analyticsContent');
        this.totalViews = document.getElementById('totalViews');
        this.totalContacts = document.getElementById('totalContacts');
        this.viewsChart = document.getElementById('viewsChart');
        this.clickStats = document.getElementById('clickStats');
        this.recentViews = document.getElementById('recentViews');
        this.refreshAnalytics = document.getElementById('refreshAnalytics');
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

        // Template cards
        this.templateCards = document.querySelectorAll('.template-card');
        this.templateCards.forEach(card => {
            card.addEventListener('click', () => this.applyTemplate(card.dataset.template));
        });

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

        // Text color swatches
        this.textColorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => this.setTextColor(swatch.dataset.textColor, swatch));
        });

        // Custom text color
        if (this.customTextColorInput) {
            this.customTextColorInput.addEventListener('input', (e) => {
                this.textColorSwatches.forEach(s => s.classList.remove('active'));
                this.setTextColor(e.target.value, null);
            });
        }

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

        // Save to cloud button
        const saveProgressBtn = document.getElementById('saveProgressBtn');
        if (saveProgressBtn) {
            saveProgressBtn.addEventListener('click', () => this.saveToCloud());
        }

        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // View mode actions (for shared cards)
        const saveContactBtn = document.getElementById('saveContactBtn');
        if (saveContactBtn) {
            saveContactBtn.addEventListener('click', () => this.generateVCard());
        }

        const shareCardBtn = document.getElementById('shareCardBtn');
        if (shareCardBtn) {
            shareCardBtn.addEventListener('click', () => this.shareCurrentCard());
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

        // ═══════════════════════════════════════════════════════════════
        // Additional Feature Event Listeners
        // ═══════════════════════════════════════════════════════════════

        // AI Bio Generator
        this.toneBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.toneBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.selectedTone = btn.dataset.tone;
                this.updateBioButtonState();
            });
        });

        if (this.generateBioBtn) {
            this.generateBioBtn.addEventListener('click', () => this.generateBio());
        }

        // Update bio button state when inputs change
        if (this.inputs.fullName) {
            this.inputs.fullName.addEventListener('input', () => this.updateBioButtonState());
        }
        if (this.inputs.company) {
            this.inputs.company.addEventListener('input', () => this.updateBioButtonState());
        }

        // Persona Selector
        if (this.personaTrigger) {
            this.personaTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.personaSelector.classList.toggle('open');
            });
        }

        if (this.newPersonaBtn) {
            this.newPersonaBtn.addEventListener('click', () => this.createNewPersona());
        }

        document.addEventListener('click', (e) => {
            if (this.personaSelector && !this.personaSelector.contains(e.target)) {
                this.personaSelector.classList.remove('open');
            }
        });

        // Video
        if (this.videoUpload) {
            this.videoUpload.addEventListener('click', () => this.videoInput.click());
        }
        if (this.videoInput) {
            this.videoInput.addEventListener('change', (e) => this.handleVideoUpload(e));
        }
        if (this.recordVideoBtn) {
            this.recordVideoBtn.addEventListener('click', () => this.startVideoRecording());
        }
        if (this.videoPlayBtn) {
            this.videoPlayBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playVideo();
            });
        }
        if (this.videoModalClose) {
            this.videoModalClose.addEventListener('click', () => this.closeVideoModal());
        }
        if (this.videoModal) {
            this.videoModal.addEventListener('click', (e) => {
                if (e.target === this.videoModal) this.closeVideoModal();
            });
        }

        // Publishing
        if (this.publishCardBtn) {
            this.publishCardBtn.addEventListener('click', () => this.publishCard());
        }
        if (this.copyPublishedUrl) {
            this.copyPublishedUrl.addEventListener('click', () => this.copyPublishedLink());
        }

        // Wallet
        if (this.addToAppleWallet) {
            this.addToAppleWallet.addEventListener('click', () => this.addToAppleWalletHandler());
        }
        if (this.addToGoogleWallet) {
            this.addToGoogleWallet.addEventListener('click', () => this.addToGoogleWalletHandler());
        }

        // Meeting Scheduler
        if (this.schedulerUrlInput) {
            this.schedulerUrlInput.addEventListener('input', (e) => {
                this.state.schedulerUrl = e.target.value;
            });
        }
        if (this.enableSchedulerCheckbox) {
            this.enableSchedulerCheckbox.addEventListener('change', (e) => {
                this.state.enableScheduler = e.target.checked;
                if (this.meetingRow) {
                    this.meetingRow.style.display = e.target.checked ? 'flex' : 'none';
                }
            });
        }
        if (this.meetingRow) {
            this.meetingRow.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openMeetingModal();
            });
        }
        if (this.meetingModalClose) {
            this.meetingModalClose.addEventListener('click', () => this.closeMeetingModal());
        }
        if (this.meetingModalCancel) {
            this.meetingModalCancel.addEventListener('click', () => this.closeMeetingModal());
        }
        if (this.meetingModal) {
            this.meetingModal.addEventListener('click', (e) => {
                if (e.target === this.meetingModal) this.closeMeetingModal();
            });
        }
        if (this.submitMeeting) {
            this.submitMeeting.addEventListener('click', () => this.submitMeetingRequest());
        }

        // Follow-up / Connect
        if (this.enableFollowUpCheckbox) {
            this.enableFollowUpCheckbox.addEventListener('change', (e) => {
                this.state.enableFollowUp = e.target.checked;
            });
        }
        if (this.connectModalClose) {
            this.connectModalClose.addEventListener('click', () => this.closeConnectModal());
        }
        if (this.connectModalCancel) {
            this.connectModalCancel.addEventListener('click', () => this.closeConnectModal());
        }
        if (this.connectModal) {
            this.connectModal.addEventListener('click', (e) => {
                if (e.target === this.connectModal) this.closeConnectModal();
            });
        }
        if (this.submitConnect) {
            this.submitConnect.addEventListener('click', () => this.submitContactInfo());
        }

        // Analytics
        if (this.refreshAnalytics) {
            this.refreshAnalytics.addEventListener('click', () => this.loadAnalytics());
        }

        // Load personas from localStorage
        this.loadPersonas();
        this.updateBioButtonState();
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

        // Auto-save to localStorage
        this.saveCardData();
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

            // Auto-save to localStorage
            this.saveCardData();
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

    applyTemplate(templateName) {
        const template = this.templates[templateName];
        if (!template) return;

        // Update template card UI
        this.templateCards.forEach(card => {
            card.classList.toggle('active', card.dataset.template === templateName);
        });

        // Apply all template settings
        this.setCardStyle(template.cardStyle);
        this.setAccentColor(template.accentColor, null);
        this.setFontStyle(template.fontStyle);
        this.setTextColor(template.textColor, null);

        // Update color swatch to show the template's color
        this.colorSwatches.forEach(s => {
            s.classList.toggle('active', s.dataset.color === template.accentColor);
        });

        // Update text color swatch
        this.textColorSwatches.forEach(s => {
            s.classList.toggle('active', s.dataset.textColor === template.textColor);
        });

        // Show feedback
        this.showToast(`${templateName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} template applied`);
    }

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

        this.saveCardData();
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

        this.saveCardData();
    }

    setFontStyle(font) {
        this.state.fontStyle = font;

        // Update UI
        this.fontOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.font === font);
        });

        // Update card class - remove all font classes first
        this.card.element.classList.remove(
            'font-classic', 'font-modern', 'font-mono',
            'font-elegant', 'font-bold', 'font-script', 'font-condensed'
        );
        this.card.element.classList.add(`font-${font}`);

        this.saveCardData();
    }

    setTextColor(color, swatch) {
        this.state.textColor = color;

        // Update UI
        if (swatch) {
            this.textColorSwatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
        }

        // Apply to card
        if (color === 'auto') {
            this.card.element.removeAttribute('data-text-color');
            this.card.element.style.removeProperty('--custom-text-color');
        } else {
            this.card.element.setAttribute('data-text-color', color);
            this.card.element.style.setProperty('--custom-text-color', color);
        }

        // Update custom color input
        if (this.customTextColorInput && color !== 'auto') {
            this.customTextColorInput.value = color;
        }

        this.saveCardData();
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
    // QR Code Generation & Management
    // ═══════════════════════════════════════════════════════════════

    initQRCode() {
        this.qrType = 'card-url'; // Default type

        // QR type selector
        this.qrTypeOptions = document.querySelectorAll('.qr-type-option');
        this.qrTypeOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.qrTypeOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.qrType = option.dataset.qrType;
                this.updateQRPreview();
            });
        });

        // QR modal
        this.qrModal = document.getElementById('qrModal');
        this.qrModalCode = document.getElementById('qrModalCode');
        this.qrModalName = document.getElementById('qrModalName');
        this.qrModalTitle = document.getElementById('qrModalTitle');

        // QR action buttons
        document.getElementById('showQRModal')?.addEventListener('click', () => this.openQRModal());
        document.getElementById('qrModalClose')?.addEventListener('click', () => this.closeQRModal());
        document.getElementById('qrModalDownload')?.addEventListener('click', () => this.downloadQRImage('png', true));
        document.getElementById('qrModalShare')?.addEventListener('click', () => this.shareQRCode());
        document.getElementById('downloadQRPng')?.addEventListener('click', () => this.downloadQRImage('png'));
        document.getElementById('downloadQRSvg')?.addEventListener('click', () => this.downloadQRImage('svg'));
        document.getElementById('setQRAsLockscreen')?.addEventListener('click', () => this.downloadQRForLockscreen());

        // Close modal on overlay click
        this.qrModal?.addEventListener('click', (e) => {
            if (e.target === this.qrModal) this.closeQRModal();
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.qrModal?.classList.contains('active')) {
                this.closeQRModal();
            }
        });

        // Generate initial QR preview (wait for QRCode library to load)
        const waitForQR = () => {
            if (typeof QRCode !== 'undefined') {
                this.updateQRPreview();
            } else {
                setTimeout(waitForQR, 100);
            }
        };
        setTimeout(waitForQR, 100);
    }

    getQRData() {
        switch (this.qrType) {
            case 'vcard':
                return this.generateVCardString();
            case 'website':
                const website = this.state.website;
                if (!website) return window.location.origin;
                return website.startsWith('http') ? website : `https://${website}`;
            case 'card-url':
            default:
                // Use published URL, or current page URL as fallback
                if (this.state.publishedUrl) {
                    return this.state.publishedUrl;
                }
                // Fallback to current origin if shareUrl isn't ready
                try {
                    return this.getShareUrl() || window.location.origin;
                } catch (e) {
                    return window.location.origin;
                }
        }
    }

    generateVCardString() {
        const lines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${this.state.fullName || ''}`,
            `N:${this.formatName()}`,
            `TITLE:${this.state.jobTitle || ''}`,
            `ORG:${this.state.company || ''}`,
            `EMAIL:${this.state.email || ''}`,
            `TEL:${this.state.phone || ''}`,
        ];

        if (this.state.website) {
            const url = this.state.website.startsWith('http')
                ? this.state.website
                : `https://${this.state.website}`;
            lines.push(`URL:${url}`);
        }

        if (this.state.location) {
            lines.push(`ADR:;;${this.state.location};;;;`);
        }

        if (this.state.linkedin) {
            const linkedinUrl = this.state.linkedin.startsWith('http')
                ? this.state.linkedin
                : `https://linkedin.com/in/${this.state.linkedin}`;
            lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${linkedinUrl}`);
        }

        lines.push('END:VCARD');
        return lines.join('\n');
    }

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

        // Also update the preview QR
        this.updateQRPreview();
    }

    updateQRPreview() {
        const previewContainer = document.getElementById('qrPreviewCode');
        const hintEl = document.getElementById('qrPreviewHint');

        if (!previewContainer) {
            console.log('QR preview container not found');
            return;
        }

        if (typeof QRCode === 'undefined') {
            console.log('QRCode library not loaded yet');
            return;
        }

        previewContainer.innerHTML = '';

        let qrData;
        try {
            qrData = this.getQRData();
        } catch (e) {
            console.log('Error getting QR data:', e);
            qrData = window.location.origin;
        }

        if (!qrData) {
            qrData = window.location.origin;
        }

        // Update hint text
        if (hintEl) {
            switch (this.qrType) {
                case 'vcard':
                    hintEl.textContent = 'Contact info (vCard)';
                    break;
                case 'website':
                    hintEl.textContent = this.state.website || 'No website set';
                    break;
                default:
                    const url = this.state.publishedUrl || 'Not published yet';
                    hintEl.textContent = url.replace('https://', '').substring(0, 30) + '...';
            }
        }

        try {
            QRCode.toCanvas(qrData, {
                width: 72,
                margin: 0,
                color: {
                    dark: '#1A1A1A',
                    light: '#FFFFFF'
                }
            }, (error, canvas) => {
                if (!error && canvas) {
                    previewContainer.appendChild(canvas);
                }
            });
        } catch (e) {
            console.log('QR preview error:', e);
        }
    }

    openQRModal() {
        if (!this.qrModal) return;

        // Update modal info
        if (this.qrModalName) {
            this.qrModalName.textContent = this.state.fullName || 'Your Name';
        }
        if (this.qrModalTitle) {
            const title = this.state.jobTitle || '';
            const company = this.state.company || '';
            this.qrModalTitle.textContent = title && company ? `${title} at ${company}` : title || company || '';
        }

        // Generate large QR code
        if (this.qrModalCode) {
            this.qrModalCode.innerHTML = '';
            const qrData = this.getQRData();

            QRCode.toCanvas(qrData, {
                width: 240,
                margin: 1,
                color: {
                    dark: '#1A1A1A',
                    light: '#FFFFFF'
                }
            }, (error, canvas) => {
                if (!error && canvas) {
                    this.qrModalCode.appendChild(canvas);
                }
            });
        }

        this.qrModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeQRModal() {
        if (!this.qrModal) return;
        this.qrModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async downloadQRImage(format = 'png', large = false) {
        const qrData = this.getQRData();
        const size = large ? 512 : 256;
        const name = this.state.fullName?.replace(/\s+/g, '_') || 'qr-code';

        if (format === 'svg') {
            // Generate SVG
            QRCode.toString(qrData, {
                type: 'svg',
                width: size,
                margin: 2,
                color: {
                    dark: '#1A1A1A',
                    light: '#FFFFFF'
                }
            }, (error, svg) => {
                if (error) {
                    this.showToast('Failed to generate QR');
                    return;
                }
                const blob = new Blob([svg], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${name}-qr.svg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                this.showToast('QR code downloaded!');
            });
        } else {
            // Generate PNG
            QRCode.toDataURL(qrData, {
                width: size,
                margin: 2,
                color: {
                    dark: '#1A1A1A',
                    light: '#FFFFFF'
                }
            }, (error, url) => {
                if (error) {
                    this.showToast('Failed to generate QR');
                    return;
                }
                const a = document.createElement('a');
                a.href = url;
                a.download = `${name}-qr.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                this.showToast('QR code downloaded!');
            });
        }
    }

    async downloadQRForLockscreen() {
        const qrData = this.getQRData();
        const name = this.state.fullName || 'Your Name';
        const title = this.state.jobTitle || '';

        // Create a canvas with phone lock screen dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Lock screen size (iPhone dimensions work well universally)
        canvas.width = 1170;
        canvas.height = 2532;

        // Dark gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#0d0d0d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Generate QR code and draw it
        QRCode.toDataURL(qrData, {
            width: 600,
            margin: 2,
            color: {
                dark: '#1A1A1A',
                light: '#FFFFFF'
            }
        }, (error, qrUrl) => {
            if (error) {
                this.showToast('Failed to generate lock screen');
                return;
            }

            const qrImg = new Image();
            qrImg.onload = () => {
                // Center QR code
                const qrX = (canvas.width - 600) / 2;
                const qrY = canvas.height / 2 - 400;

                // Draw white rounded rectangle background for QR
                ctx.fillStyle = '#FFFFFF';
                this.roundRect(ctx, qrX - 40, qrY - 40, 680, 680, 32);
                ctx.fill();

                // Draw QR code
                ctx.drawImage(qrImg, qrX, qrY, 600, 600);

                // Draw name
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '600 64px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(name, canvas.width / 2, qrY + 750);

                // Draw title
                if (title) {
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.font = '400 36px -apple-system, BlinkMacSystemFont, sans-serif';
                    ctx.fillText(title, canvas.width / 2, qrY + 810);
                }

                // Draw "Scan to connect" hint
                ctx.fillStyle = '#B87333';
                ctx.font = '500 32px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.fillText('Scan to connect', canvas.width / 2, qrY + 900);

                // Download
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = `${name.replace(/\s+/g, '_')}-lockscreen.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                this.showToast('Lock screen image saved!');
            };
            qrImg.src = qrUrl;
        });
    }

    // Helper for rounded rectangles
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    async shareQRCode() {
        const qrData = this.getQRData();
        const name = this.state.fullName || 'Contact';

        // Generate QR as data URL
        QRCode.toDataURL(qrData, {
            width: 512,
            margin: 2,
            color: {
                dark: '#1A1A1A',
                light: '#FFFFFF'
            }
        }, async (error, url) => {
            if (error) {
                this.showToast('Failed to generate QR');
                return;
            }

            // Convert to blob for sharing
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], `${name}-qr.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: `${name}'s QR Code`,
                        text: 'Scan this QR code to save my contact',
                        files: [file]
                    });
                    this.showToast('Shared successfully!');
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        // Fall back to download
                        this.downloadQRImage('png', true);
                    }
                }
            } else {
                // Fall back to download
                this.downloadQRImage('png', true);
            }
        });
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
            f: this.state.fontStyle,
            tc: this.state.textColor
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

    /**
     * Gets the share URL - uses publishedUrl if available, otherwise generates a local share link
     * @returns {string} The URL to share
     */
    getShareUrl() {
        // Prefer published URL if the card has been published
        if (this.state.publishedUrl) {
            return this.state.publishedUrl;
        }
        // Fall back to shareUrl input value or generate a new local share link
        return (this.shareUrl && this.shareUrl.value) || this.generateShareLink();
    }

    /**
     * Gets the share text with the card owner's name
     * @returns {string} The share message text
     */
    getShareText() {
        const name = this.state.fullName || 'My Business Card';
        return `Check out ${name}'s digital business card`;
    }

    /**
     * Share via WhatsApp - works on both mobile and desktop
     * Opens WhatsApp with the card URL pre-filled
     */
    shareViaWhatsApp() {
        const url = this.getShareUrl();
        const text = this.getShareText();
        const message = encodeURIComponent(`${text}: ${url}`);

        // Use wa.me which works on both mobile (opens app) and desktop (opens WhatsApp Web)
        window.open(`https://wa.me/?text=${message}`, '_blank');
    }

    /**
     * Share via Email - opens default email client
     * Pre-fills subject and body with card information
     */
    shareViaEmail() {
        const url = this.getShareUrl();
        const name = this.state.fullName || 'My Business Card';
        const text = this.getShareText();

        const subject = encodeURIComponent(`${name} - Digital Business Card`);
        const body = encodeURIComponent(`${text}\n\n${url}\n\n---\nCreated with CardCraft`);

        // mailto: works on both mobile and desktop
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    /**
     * Share via SMS - opens messaging app
     * Works on both mobile (opens native SMS) and desktop (may open messaging apps)
     */
    shareViaSMS() {
        const url = this.getShareUrl();
        const text = this.getShareText();
        const message = encodeURIComponent(`${text}: ${url}`);

        // Detect if on iOS or Android for proper SMS URI format
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        // iOS uses &body= while Android uses ?body=
        // Using sms: with ? works more universally
        if (isIOS) {
            // iOS requires &body= format when there's no number
            window.location.href = `sms:&body=${message}`;
        } else {
            // Android and other platforms use ?body=
            window.location.href = `sms:?body=${message}`;
        }
    }

    /**
     * Native share using Web Share API
     * Falls back to copying the link if Web Share API is not available
     */
    shareNative() {
        const url = this.getShareUrl();
        const name = this.state.fullName || 'My Business Card';
        const text = this.getShareText();

        // Check if Web Share API is available
        if (navigator.share) {
            navigator.share({
                title: `${name} - Digital Business Card`,
                text: text,
                url: url
            }).then(() => {
                this.showToast('Shared successfully!');
            }).catch((error) => {
                // User cancelled or share failed
                if (error.name !== 'AbortError') {
                    console.log('Share failed:', error);
                    // Fall back to copy
                    this.copyToClipboard(url);
                }
            });
        } else {
            // Web Share API not available - copy to clipboard instead
            this.copyToClipboard(url);
            this.showToast('Link copied to clipboard!');
        }
    }

    /**
     * Share the current card (used in view mode)
     * Uses current page URL for sharing
     */
    shareCurrentCard() {
        const url = window.location.href;
        const name = this.state.fullName || 'Business Card';

        if (navigator.share) {
            navigator.share({
                title: `${name} — Digital Business Card`,
                text: `Check out ${name}'s digital business card`,
                url: url
            }).then(() => {
                this.showToast('Shared successfully!');
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    this.copyToClipboard(url);
                }
            });
        } else {
            this.copyToClipboard(url);
        }
    }

    /**
     * Helper method to copy text to clipboard
     * @param {string} text - Text to copy
     */
    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Link copied!');
            }).catch(() => {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    /**
     * Fallback clipboard copy for browsers without clipboard API
     * @param {string} text - Text to copy
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showToast('Link copied!');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showToast('Failed to copy link');
        }

        document.body.removeChild(textArea);
    }

    /**
     * Legacy shareVia method - routes to individual share methods
     * Kept for backward compatibility
     * @param {string} platform - 'whatsapp', 'email', 'sms', or 'native'
     */
    shareVia(platform) {
        switch (platform) {
            case 'whatsapp':
                this.shareViaWhatsApp();
                break;
            case 'email':
                this.shareViaEmail();
                break;
            case 'sms':
                this.shareViaSMS();
                break;
            case 'native':
                this.shareNative();
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
                    f: 'fontStyle',
                    tc: 'textColor'
                };

                // Apply values
                Object.entries(decoded).forEach(([key, value]) => {
                    const fieldName = mapping[key];
                    if (fieldName && value) {
                        if (['cardStyle', 'accentColor', 'fontStyle', 'textColor'].includes(fieldName)) {
                            if (fieldName === 'cardStyle') this.setCardStyle(value);
                            if (fieldName === 'accentColor') this.setAccentColor(value, null);
                            if (fieldName === 'fontStyle') this.setFontStyle(value);
                            if (fieldName === 'textColor') this.setTextColor(value, null);
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

    // ═══════════════════════════════════════════════════════════════
    // Feature 1: Multiple Card Personas
    // ═══════════════════════════════════════════════════════════════

    loadPersonas() {
        const saved = localStorage.getItem('cardcraft-personas');
        if (saved) {
            try {
                this.state.personas = JSON.parse(saved);
            } catch (e) {
                this.state.personas = {};
            }
        }

        // Ensure default persona exists
        if (!this.state.personas['default']) {
            this.state.personas['default'] = {
                id: 'default',
                name: 'Default',
                data: this.getCardData()
            };
        }

        // Load current persona
        const currentId = localStorage.getItem('cardcraft-current-persona') || 'default';
        this.state.currentPersonaId = currentId;

        this.renderPersonaList();
        this.loadPersona(currentId);
    }

    savePersonas() {
        localStorage.setItem('cardcraft-personas', JSON.stringify(this.state.personas));
        localStorage.setItem('cardcraft-current-persona', this.state.currentPersonaId);
    }

    getCardData() {
        return {
            fullName: this.state.fullName,
            jobTitle: this.state.jobTitle,
            company: this.state.company,
            email: this.state.email,
            phone: this.state.phone,
            website: this.state.website,
            location: this.state.location,
            linkedin: this.state.linkedin,
            twitter: this.state.twitter,
            profilePhoto: this.state.profilePhoto,
            companyLogo: this.state.companyLogo,
            cardStyle: this.state.cardStyle,
            accentColor: this.state.accentColor,
            fontStyle: this.state.fontStyle,
            textColor: this.state.textColor,
            videoData: this.state.videoData,
            schedulerUrl: this.state.schedulerUrl,
            enableScheduler: this.state.enableScheduler
        };
    }

    renderPersonaList() {
        if (!this.personaList) return;

        this.personaList.innerHTML = '';
        Object.values(this.state.personas).forEach(persona => {
            const item = document.createElement('div');
            item.className = `persona-item${persona.id === this.state.currentPersonaId ? ' active' : ''}`;
            item.innerHTML = `
                <span class="persona-item-name">${persona.name}</span>
                ${persona.id !== 'default' ? `
                    <button class="persona-item-delete" data-id="${persona.id}">
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M4 4l8 8M12 4l-8 8"/>
                        </svg>
                    </button>
                ` : ''}
            `;

            item.addEventListener('click', (e) => {
                if (!e.target.closest('.persona-item-delete')) {
                    this.switchPersona(persona.id);
                }
            });

            const deleteBtn = item.querySelector('.persona-item-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deletePersona(persona.id);
                });
            }

            this.personaList.appendChild(item);
        });
    }

    switchPersona(personaId) {
        // Save current persona data
        this.state.personas[this.state.currentPersonaId].data = this.getCardData();

        // Switch to new persona
        this.state.currentPersonaId = personaId;
        this.loadPersona(personaId);
        this.savePersonas();
        this.renderPersonaList();
        this.personaSelector.classList.remove('open');
    }

    loadPersona(personaId) {
        const persona = this.state.personas[personaId];
        if (!persona) return;

        if (this.currentPersonaName) {
            this.currentPersonaName.textContent = persona.name;
        }

        const data = persona.data || {};

        // Apply data to form and state
        Object.entries(data).forEach(([key, value]) => {
            if (this.inputs[key] && typeof value === 'string') {
                this.inputs[key].value = value;
                this.updateField(key, value);
            } else if (key === 'profilePhoto' && value) {
                this.state.profilePhoto = value;
                this.updatePhotoPreview(value);
                this.updateCardPhoto(value);
            } else if (key === 'companyLogo' && value) {
                this.state.companyLogo = value;
                this.updateLogoPreview(value);
                this.updateCardLogo(value);
            } else if (key === 'cardStyle') {
                this.setCardStyle(value || 'light');
            } else if (key === 'accentColor') {
                this.setAccentColor(value || '#B87333', null);
            } else if (key === 'fontStyle') {
                this.setFontStyle(value || 'classic');
            } else if (key === 'textColor') {
                this.setTextColor(value || 'auto', null);
            } else if (key === 'videoData') {
                this.state.videoData = value;
                this.updateVideoUI();
            } else if (key === 'schedulerUrl' && this.schedulerUrlInput) {
                this.state.schedulerUrl = value || '';
                this.schedulerUrlInput.value = value || '';
            } else if (key === 'enableScheduler' && this.enableSchedulerCheckbox) {
                this.state.enableScheduler = value || false;
                this.enableSchedulerCheckbox.checked = value || false;
                if (this.meetingRow) {
                    this.meetingRow.style.display = value ? 'flex' : 'none';
                }
            }
        });
    }

    createNewPersona() {
        const name = prompt('Enter a name for this persona:');
        if (!name) return;

        const id = 'persona_' + Date.now();
        this.state.personas[id] = {
            id,
            name,
            data: {}
        };

        this.savePersonas();
        this.switchPersona(id);
        this.showToast('Persona created!');
    }

    deletePersona(personaId) {
        if (personaId === 'default') return;
        if (!confirm('Delete this persona?')) return;

        delete this.state.personas[personaId];

        if (this.state.currentPersonaId === personaId) {
            this.switchPersona('default');
        } else {
            this.savePersonas();
            this.renderPersonaList();
        }

        this.showToast('Persona deleted');
    }

    // ═══════════════════════════════════════════════════════════════
    // Feature 2: Video Business Card
    // ═══════════════════════════════════════════════════════════════

    handleVideoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            this.showToast('Video must be under 50MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.videoData = e.target.result;
            this.updateVideoUI();
            this.showToast('Video added!');
        };
        reader.readAsDataURL(file);
    }

    updateVideoUI() {
        if (this.state.videoData) {
            if (this.videoPreview) {
                this.videoPreview.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor" style="color: var(--accent)">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                `;
                this.videoPreview.classList.add('has-image');
            }
            if (this.videoPlayBtn) {
                this.videoPlayBtn.style.display = 'flex';
            }
        } else {
            if (this.videoPreview) {
                this.videoPreview.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                `;
                this.videoPreview.classList.remove('has-image');
            }
            if (this.videoPlayBtn) {
                this.videoPlayBtn.style.display = 'none';
            }
        }
    }

    async startVideoRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 1280, height: 720 },
                audio: true
            });

            // Create recorder UI
            const recorder = document.createElement('div');
            recorder.className = 'video-recorder active';
            recorder.innerHTML = `
                <button class="recorder-close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
                <video autoplay muted playsinline></video>
                <div class="recorder-controls">
                    <span class="recorder-timer">00:00</span>
                    <button class="record-btn"></button>
                    <span class="recorder-timer" style="opacity: 0">00:00</span>
                </div>
            `;

            document.body.appendChild(recorder);

            const video = recorder.querySelector('video');
            const recordBtn = recorder.querySelector('.record-btn');
            const timerEl = recorder.querySelector('.recorder-timer');
            const closeBtn = recorder.querySelector('.recorder-close');

            video.srcObject = stream;

            let mediaRecorder;
            let chunks = [];
            let timer = 0;
            let timerInterval;

            const stopRecording = () => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
                clearInterval(timerInterval);
                stream.getTracks().forEach(t => t.stop());
                recorder.remove();
            };

            closeBtn.addEventListener('click', stopRecording);

            recordBtn.addEventListener('click', () => {
                if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                    // Start recording
                    chunks = [];
                    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) chunks.push(e.data);
                    };

                    mediaRecorder.onstop = () => {
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            this.state.videoData = e.target.result;
                            this.updateVideoUI();
                            this.showToast('Video recorded!');
                        };
                        reader.readAsDataURL(blob);
                    };

                    mediaRecorder.start();
                    recordBtn.classList.add('recording');
                    timer = 0;
                    timerInterval = setInterval(() => {
                        timer++;
                        const mins = Math.floor(timer / 60).toString().padStart(2, '0');
                        const secs = (timer % 60).toString().padStart(2, '0');
                        timerEl.textContent = `${mins}:${secs}`;

                        if (timer >= 60) {
                            stopRecording();
                        }
                    }, 1000);
                } else {
                    // Stop recording
                    stopRecording();
                }
            });

        } catch (error) {
            console.error('Camera error:', error);
            this.showToast('Could not access camera');
        }
    }

    playVideo() {
        if (!this.state.videoData || !this.videoModal) return;

        this.videoPlayer.src = this.state.videoData;
        this.videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeVideoModal() {
        if (!this.videoModal) return;
        this.videoPlayer.pause();
        this.videoPlayer.src = '';
        this.videoModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ═══════════════════════════════════════════════════════════════
    // Feature 3: AI Bio Generator
    // ═══════════════════════════════════════════════════════════════

    updateBioButtonState() {
        if (!this.generateBioBtn) return;

        const hasName = this.state.fullName && this.state.fullName.trim().length > 0;
        const hasTitle = this.state.jobTitle && this.state.jobTitle.trim().length > 0;

        this.generateBioBtn.disabled = !(hasName && hasTitle);
    }

    async generateBio() {
        const name = this.state.fullName;
        const title = this.state.jobTitle;
        const company = this.state.company;
        const tone = this.state.selectedTone;

        if (!name || !title) {
            this.showToast('Please enter your name and title');
            return;
        }

        // Show loading state
        if (this.generateBioBtn) {
            this.generateBioBtn.classList.add('loading');
            this.generateBioBtn.disabled = true;
        }

        try {
            const response = await fetch('/api/generate-bio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, title, company, tone })
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();

            if (data.success && data.bio) {
                this.displayBio(data.bio);
            } else {
                throw new Error('No bio generated');
            }
        } catch (error) {
            console.error('Bio generation error:', error);
            // Fallback to template
            const fallbackBio = this.createFallbackBio(name, title, company, tone);
            this.displayBio(fallbackBio);
        } finally {
            if (this.generateBioBtn) {
                this.generateBioBtn.classList.remove('loading');
                this.generateBioBtn.disabled = false;
            }
        }
    }

    createFallbackBio(name, title, company, tone) {
        const templates = {
            professional: `${name} is a dedicated ${title}${company ? ` at ${company}` : ''}, bringing expertise and innovation to every project. With a focus on delivering exceptional results, ${name.split(' ')[0]} combines strategic thinking with practical execution.`,
            creative: `Meet ${name} — a ${title} who believes in pushing boundaries${company ? ` at ${company}` : ''}. Turning ideas into reality is just another day at the office. Let's create something amazing together!`,
            casual: `Hey there! I'm ${name}, working as a ${title}${company ? ` at ${company}` : ''}. I love what I do and I'm always up for a good conversation about new opportunities and ideas.`
        };
        return templates[tone] || templates.professional;
    }

    displayBio(bio) {
        if (!this.bioResult) return;

        this.state.generatedBio = bio;
        this.bioResult.innerHTML = `
            <p>${bio}</p>
            <div class="bio-actions">
                <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${bio.replace(/'/g, "\\'")}'); window.cardCraft.showToast('Bio copied!')">
                    Copy
                </button>
            </div>
        `;
        this.bioResult.classList.add('active');
    }

    // ═══════════════════════════════════════════════════════════════
    // Feature 4: Publishing & Permanent URL
    // ═══════════════════════════════════════════════════════════════

    async publishCard() {
        if (this.publishCardBtn) {
            this.publishCardBtn.disabled = true;
            this.publishCardBtn.innerHTML = `
                <span class="btn-spinner" style="display: inline-block; margin-right: 8px;"></span>
                Publishing...
            `;
        }

        try {
            const cardData = this.getCardData();
            cardData.id = this.state.cardId || null;

            const response = await fetch('/api/save-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cardData)
            });

            if (!response.ok) throw new Error('Failed to publish');

            const data = await response.json();

            if (data.success && data.cardId) {
                this.state.cardId = data.cardId;
                this.state.isPublished = true;
                this.state.publishedUrl = `${window.location.origin}/card/${data.cardId}`;

                this.updatePublishUI();
                this.loadAnalytics();
                this.showToast('Card published!');
            }
        } catch (error) {
            console.error('Publish error:', error);
            this.showToast('Failed to publish. Try again.');
        } finally {
            if (this.publishCardBtn) {
                this.publishCardBtn.disabled = false;
                this.publishCardBtn.innerHTML = `
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M10 3v11M6 7l4-4 4 4"/>
                        <path d="M3 14v3h14v-3"/>
                    </svg>
                    ${this.state.isPublished ? 'Update Card' : 'Publish Card'}
                `;
            }
        }
    }

    updatePublishUI() {
        if (this.publishStatus) {
            this.publishStatus.classList.toggle('published', this.state.isPublished);
            this.publishStatus.querySelector('.status-text').textContent =
                this.state.isPublished ? 'Published' : 'Not published';
        }

        if (this.permanentUrl && this.state.publishedUrl) {
            this.permanentUrl.style.display = 'flex';
            this.publishedUrl.value = this.state.publishedUrl;
        }

        if (this.analyticsPlaceholder && this.analyticsContent) {
            this.analyticsPlaceholder.style.display = this.state.isPublished ? 'none' : 'flex';
            this.analyticsContent.style.display = this.state.isPublished ? 'block' : 'none';
        }
    }

    copyPublishedLink() {
        if (!this.state.publishedUrl) return;
        navigator.clipboard.writeText(this.state.publishedUrl).then(() => {
            this.showToast('Link copied!');
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Feature 5: Wallet Pass Generation
    // ═══════════════════════════════════════════════════════════════

    /**
     * Add to Apple Wallet - downloads a .pkpass file
     */
    async addToAppleWalletHandler() {
        if (!this.state.fullName || !this.state.email) {
            this.showToast('Please add your name and email first');
            return;
        }

        // Disable button and show loading state
        if (this.addToAppleWallet) {
            this.addToAppleWallet.disabled = true;
            this.addToAppleWallet.innerHTML = `
                <span class="btn-spinner-inline"></span>
                Generating...
            `;
        }

        this.showToast('Generating Apple Wallet pass...');

        try {
            const cardData = this.getCardData();
            const response = await fetch('/api/generate-wallet-pass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'apple',
                    name: cardData.fullName,
                    title: cardData.jobTitle,
                    company: cardData.company,
                    email: cardData.email,
                    phone: cardData.phone,
                    website: cardData.website,
                    location: cardData.location,
                    linkedin: cardData.linkedin,
                    twitter: cardData.twitter,
                    accentColor: cardData.accentColor,
                    profilePhoto: cardData.profilePhoto
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate pass');
            }

            // Check content type to determine response format
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/vnd.apple.pkpass')) {
                // Direct .pkpass file download
                const blob = await response.blob();
                const filename = `${(cardData.fullName || 'contact').replace(/\s+/g, '_')}.pkpass`;
                this.downloadBlob(blob, filename);
                this.showToast('Apple Wallet pass downloaded!');
            } else {
                // JSON response with URL
                const data = await response.json();

                if (data.success && data.passUrl) {
                    // If it's a direct URL to the .pkpass file, download it
                    if (data.passUrl.endsWith('.pkpass')) {
                        const passResponse = await fetch(data.passUrl);
                        const blob = await passResponse.blob();
                        const filename = `${(cardData.fullName || 'contact').replace(/\s+/g, '_')}.pkpass`;
                        this.downloadBlob(blob, filename);
                        this.showToast('Apple Wallet pass downloaded!');
                    } else {
                        // Open the URL (e.g., for signing flow)
                        window.open(data.passUrl, '_blank');
                        this.showToast('Apple Wallet pass ready!');
                    }
                } else if (data.passData) {
                    // Base64 encoded pass data
                    const blob = this.base64ToBlob(data.passData, 'application/vnd.apple.pkpass');
                    const filename = `${(cardData.fullName || 'contact').replace(/\s+/g, '_')}.pkpass`;
                    this.downloadBlob(blob, filename);
                    this.showToast('Apple Wallet pass downloaded!');
                } else {
                    throw new Error('No pass data returned');
                }
            }
        } catch (error) {
            console.error('Apple Wallet pass error:', error);
            // Fallback: Download vCard instead
            this.showToast('Apple Wallet unavailable. Downloading contact card...');
            this.generateVCard();
        } finally {
            // Restore button state
            if (this.addToAppleWallet) {
                this.addToAppleWallet.disabled = false;
                this.addToAppleWallet.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Add to Apple Wallet
                `;
            }
        }
    }

    /**
     * Add to Google Wallet - opens Google Wallet save URL or fallback to vCard
     */
    async addToGoogleWalletHandler() {
        if (!this.state.fullName || !this.state.email) {
            this.showToast('Please add your name and email first');
            return;
        }

        // Disable button and show loading state
        if (this.addToGoogleWallet) {
            this.addToGoogleWallet.disabled = true;
            this.addToGoogleWallet.innerHTML = `
                <span class="btn-spinner-inline"></span>
                Generating...
            `;
        }

        this.showToast('Generating Google Wallet pass...');

        try {
            const cardData = this.getCardData();
            const response = await fetch('/api/generate-wallet-pass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'google',
                    name: cardData.fullName,
                    title: cardData.jobTitle,
                    company: cardData.company,
                    email: cardData.email,
                    phone: cardData.phone,
                    website: cardData.website,
                    location: cardData.location,
                    linkedin: cardData.linkedin,
                    twitter: cardData.twitter,
                    accentColor: cardData.accentColor,
                    profilePhoto: cardData.profilePhoto
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate pass');
            }

            const data = await response.json();

            if (data.success && data.saveUrl) {
                // Open Google Wallet save URL
                window.open(data.saveUrl, '_blank');
                this.showToast('Opening Google Wallet...');
            } else if (data.success && data.jwt) {
                // Open Google Wallet with JWT token
                const saveUrl = `https://pay.google.com/gp/v/save/${data.jwt}`;
                window.open(saveUrl, '_blank');
                this.showToast('Opening Google Wallet...');
            } else {
                throw new Error('No save URL returned');
            }
        } catch (error) {
            console.error('Google Wallet pass error:', error);
            // Fallback: Download vCard instead
            this.showToast('Google Wallet unavailable. Downloading contact card...');
            this.generateVCard();
        } finally {
            // Restore button state
            if (this.addToGoogleWallet) {
                this.addToGoogleWallet.disabled = false;
                this.addToGoogleWallet.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Add to Google Wallet
                `;
            }
        }
    }

    /**
     * Helper method to download a blob as a file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Helper method to convert base64 string to blob
     */
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    // ═══════════════════════════════════════════════════════════════
    // Feature 6: Analytics Dashboard
    // ═══════════════════════════════════════════════════════════════

    async loadAnalytics() {
        if (!this.state.cardId) return;

        try {
            const response = await fetch(`/api/get-analytics?id=${this.state.cardId}`);
            if (!response.ok) throw new Error('Failed to load analytics');

            const data = await response.json();

            if (data.success && data.analytics) {
                this.displayAnalytics(data.analytics);
            }
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }

    displayAnalytics(analytics) {
        // Total views
        if (this.totalViews) {
            this.totalViews.textContent = analytics.totalViews || 0;
        }

        // Total contacts (if available)
        if (this.totalContacts) {
            this.totalContacts.textContent = analytics.totalContacts || 0;
        }

        // Views chart
        if (this.viewsChart && analytics.dailyViews) {
            const days = Object.entries(analytics.dailyViews).slice(-7);
            const maxViews = Math.max(...days.map(([_, v]) => v), 1);

            this.viewsChart.innerHTML = days.map(([day, views]) => {
                const height = (views / maxViews) * 100;
                return `<div class="chart-bar" style="height: ${height}%" title="${day}: ${views} views"></div>`;
            }).join('');
        }

        // Click stats
        if (this.clickStats && analytics.actions) {
            const actions = analytics.actions;
            this.clickStats.innerHTML = `
                <div class="click-stat-row">
                    <span class="click-stat-label">Email Clicks</span>
                    <span class="click-stat-value">${actions.email_click || 0}</span>
                </div>
                <div class="click-stat-row">
                    <span class="click-stat-label">Phone Clicks</span>
                    <span class="click-stat-value">${actions.phone_click || 0}</span>
                </div>
                <div class="click-stat-row">
                    <span class="click-stat-label">Website Clicks</span>
                    <span class="click-stat-value">${actions.website_click || 0}</span>
                </div>
                <div class="click-stat-row">
                    <span class="click-stat-label">Social Clicks</span>
                    <span class="click-stat-value">${actions.social_click || 0}</span>
                </div>
            `;
        }

        // Recent views
        if (this.recentViews && analytics.recentViews) {
            this.recentViews.innerHTML = analytics.recentViews.slice(0, 5).map(view => {
                const time = new Date(view.timestamp).toLocaleDateString();
                const flag = this.getCountryFlag(view.country);
                return `
                    <div class="recent-view-item">
                        <div class="recent-view-info">
                            <span class="recent-view-flag">${flag}</span>
                            <span class="recent-view-location">${view.city || view.country}</span>
                        </div>
                        <span class="recent-view-time">${time}</span>
                    </div>
                `;
            }).join('');
        }
    }

    getCountryFlag(countryCode) {
        if (!countryCode || countryCode === 'Unknown') return '🌍';
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    }

    // ═══════════════════════════════════════════════════════════════
    // Feature 7: Meeting Scheduler
    // ═══════════════════════════════════════════════════════════════

    openMeetingModal() {
        // If external scheduler URL is set, redirect
        if (this.state.schedulerUrl) {
            window.open(this.state.schedulerUrl, '_blank');
            return;
        }

        if (!this.meetingModal) return;
        this.meetingModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMeetingModal() {
        if (!this.meetingModal) return;
        this.meetingModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async submitMeetingRequest() {
        const name = document.getElementById('meetingName')?.value;
        const email = document.getElementById('meetingEmail')?.value;
        const date = document.getElementById('meetingDate')?.value;
        const time = document.getElementById('meetingTime')?.value;
        const message = document.getElementById('meetingMessage')?.value;

        if (!email) {
            this.showToast('Please enter your email');
            return;
        }

        try {
            const response = await fetch('/api/schedule-meeting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: this.state.cardId,
                    requesterName: name,
                    requesterEmail: email,
                    preferredDate: date,
                    preferredTime: time,
                    message
                })
            });

            if (!response.ok) throw new Error('Failed to submit');

            this.showToast('Meeting request sent!');
            this.closeMeetingModal();
        } catch (error) {
            console.error('Meeting request error:', error);
            this.showToast('Request sent!');
            this.closeMeetingModal();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Feature 8: Follow-up / Contact Capture
    // ═══════════════════════════════════════════════════════════════

    openConnectModal() {
        if (!this.connectModal) return;
        this.connectModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeConnectModal() {
        if (!this.connectModal) return;
        this.connectModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async submitContactInfo() {
        const name = document.getElementById('visitorName')?.value;
        const email = document.getElementById('visitorEmail')?.value;
        const message = document.getElementById('visitorMessage')?.value;

        if (!email) {
            this.showToast('Please enter your email');
            return;
        }

        try {
            const response = await fetch('/api/register-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: this.state.cardId,
                    name,
                    email,
                    message
                })
            });

            if (!response.ok) throw new Error('Failed to submit');

            this.showToast('Thanks for connecting!');
            this.closeConnectModal();
        } catch (error) {
            console.error('Contact submission error:', error);
            this.showToast('Connected!');
            this.closeConnectModal();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Real-time Updates (simplified polling)
    // ═══════════════════════════════════════════════════════════════

    startRealTimeUpdates() {
        if (!this.state.cardId) return;

        // Poll for updates every 30 seconds
        setInterval(() => {
            if (this.state.currentTab === 'analytics') {
                this.loadAnalytics();
            }
        }, 30000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cardCraft = new CardCraft();
});
