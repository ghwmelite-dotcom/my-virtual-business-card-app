/**
 * CardCraft — Virtual Business Card Studio
 * Interactive business card editor with live preview
 */

class CardCraft {
    constructor() {
        this.card = document.getElementById('businessCard');
        this.currentStyle = 'modern';
        this.currentFont = 'serif';
        this.profileImage = null;
        this.logoImage = null;

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
        this.generateQRCode();
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
                // Update active state
                styleOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');

                // Update card style
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

                // Update color inputs
                document.getElementById('primaryColor').value = primary;
                document.getElementById('accentColor').value = accent;
                document.getElementById('primaryColorValue').textContent = primary;
                document.getElementById('accentColorValue').textContent = accent;

                // Update CSS variables
                document.documentElement.style.setProperty('--card-primary', primary);
                document.documentElement.style.setProperty('--card-accent', accent);

                // Animation feedback
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
                // Update active state
                fontOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');

                // Update card font
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

        // Click card to flip
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

        // Ensure proper URL format
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
    // Export Functionality
    // ═══════════════════════════════════════════════════════════════

    bindExport() {
        const exportBtn = document.getElementById('exportBtn');

        exportBtn.addEventListener('click', async () => {
            exportBtn.disabled = true;
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
            exportBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download Card
            `;
        });
    }

    async exportCards() {
        const wasFlipped = this.card.classList.contains('flipped');

        // Temporarily remove transforms for clean export
        const originalTransform = this.card.style.transform;
        this.card.style.transform = 'none';
        this.card.classList.remove('flipped');

        // Wait for any animations to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Export front
        const frontCanvas = await html2canvas(document.getElementById('cardFront'), {
            scale: 3,
            backgroundColor: null,
            useCORS: true,
            logging: false
        });

        // Flip for back
        this.card.classList.add('flipped');
        await new Promise(resolve => setTimeout(resolve, 100));

        // Export back
        const backCanvas = await html2canvas(document.getElementById('cardBack'), {
            scale: 3,
            backgroundColor: null,
            useCORS: true,
            logging: false
        });

        // Restore original state
        this.card.style.transform = originalTransform;
        if (!wasFlipped) {
            this.card.classList.remove('flipped');
        }

        // Create combined image
        const combinedCanvas = document.createElement('canvas');
        const gap = 60;
        combinedCanvas.width = frontCanvas.width;
        combinedCanvas.height = frontCanvas.height * 2 + gap;

        const ctx = combinedCanvas.getContext('2d');
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

        ctx.drawImage(frontCanvas, 0, 0);
        ctx.drawImage(backCanvas, 0, frontCanvas.height + gap);

        // Download
        const link = document.createElement('a');
        link.download = 'business-card.png';
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
