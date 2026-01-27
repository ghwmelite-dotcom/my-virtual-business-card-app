# CardCraft — Virtual Business Card Studio

A sleek, modern web app for creating and customizing digital business cards with live preview and export functionality.

![CardCraft Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## Features

### Profile Information
- Full name, job title, and company
- Contact details (email, phone, website, location)
- Social media links (LinkedIn, Twitter/X, Instagram)

### Image Upload
- Profile photo with drag-and-drop support
- Company logo upload
- Real-time preview updates

### Design Customization
| Style | Description |
|-------|-------------|
| **Modern** | Dark background with gradient accent bar |
| **Classic** | Elegant cream paper aesthetic |
| **Bold** | Vibrant accent color background |
| **Minimal** | Clean white with subtle details |

- **Custom Colors**: Pick any primary and accent color
- **6 Color Presets**: Midnight Rose, Ocean Sunset, Forest Night, Royal Gold, Navy Cream, Ivory Ink
- **3 Font Options**: Serif (elegant), Sans (modern), Mono (technical)

### Interactive Preview
- Live updates as you type
- Click card to flip between front and back
- Auto-generated QR code from your website or email

### Interactive & Animated Effects
| Effect | Description |
|--------|-------------|
| **Holographic Shimmer** | Tilt-reactive rainbow overlay like premium credit cards |
| **Dynamic Shine** | Light reflection that follows your cursor |
| **Ambient Glow** | Soft accent-colored glow around the card |
| **Floating Particles** | Subtle animated particles in the background |
| **3D Tilt** | Up to 15° rotation based on mouse position |
| **Entrance Animation** | Staggered reveal animation on page load |

All effects can be toggled on/off in the Design section. Touch support included for mobile devices.

### Sharing & Connectivity
| Feature | Description |
|---------|-------------|
| **Unique Card URL** | Generate shareable links that encode your card data |
| **vCard Download** | One-click "Add to Contacts" with .vcf file export |
| **NFC Tap-to-Share** | Share via NFC on supported Android devices |
| **WhatsApp Share** | Send card directly via WhatsApp with pre-filled message |
| **SMS Share** | Quick SMS sharing with card link |
| **Email Share** | Professional email template with your card info |
| **Native Share** | Use system share dialog on mobile devices |
| **Apple/Google Wallet** | Wallet integration with vCard fallback |

### Export
- High-resolution PNG download (front + back)
- vCard (.vcf) for direct contact import
- Shareable URL with encoded card data

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/ghwmelite-dotcom/my-virtual-business-card-app.git
   ```

2. Open `index.html` in your browser

3. Start customizing your card!

## Live Demo

Visit the live app: [CardCraft on Cloudflare Pages](https://my-virtual-business-card-app.pages.dev)

## Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** — No framework dependencies
- **[QRCode.js](https://github.com/soldair/node-qrcode)** — QR code generation
- **[html2canvas](https://html2canvas.hertzen.com/)** — Card export functionality
- **Web Share API** — Native system sharing on mobile
- **Web NFC API** — NFC tap-to-share on Android
- **vCard 3.0** — Standard contact file format

## Project Structure

```
├── index.html    # Main HTML structure
├── styles.css    # All styling and animations
├── app.js        # Application logic
└── README.md     # Documentation
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License — feel free to use this for personal or commercial projects.

---

<p align="center">
  <strong>◈ CardCraft</strong><br>
  <em>Design your digital presence</em>
</p>
