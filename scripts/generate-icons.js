const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate an SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#67e8f9" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- Background squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3" />
  
  <!-- Subtle circular accent glow -->
  <circle cx="256" cy="220" r="140" fill="#3b82f6" opacity="0.25" filter="url(#glow)" />
  
  <!-- Graduation Cap Base -->
  <!-- Cap Rhombus Top -->
  <polygon points="256,130 400,195 256,260 112,195" fill="url(#cyanGrad)" />
  <!-- Cap Underband / Skull Cap -->
  <path d="M168,225 L168,295 C168,340 344,340 344,295 L344,225 L256,265 Z" fill="#1e293b" stroke="url(#cyanGrad)" stroke-width="8" stroke-linejoin="round" />
  
  <!-- Tassel Cord & Pendant -->
  <path d="M256,195 Q380,210 395,290" fill="none" stroke="url(#goldGrad)" stroke-width="10" stroke-linecap="round" />
  <circle cx="395" cy="295" r="14" fill="url(#goldGrad)" />
  <polygon points="390,305 400,305 404,335 386,335" fill="url(#goldGrad)" />

  <!-- Intelligent AI Sparkle Star -->
  <path d="M256,155 Q256,195 216,195 Q256,195 256,235 Q256,195 296,195 Q256,195 256,155 Z" fill="url(#goldGrad)" filter="url(#glow)" />
  
  <!-- Academic Chevron Wings -->
  <path d="M140,360 L256,410 L372,360" fill="none" stroke="#38bdf8" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
  <path d="M176,395 L256,430 L336,395" fill="none" stroke="url(#goldGrad)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon.svg'), svgContent);

// Programmatic pixel generation for PNG icons
function renderPng(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = isMaskable ? size / 2 : size * 0.44; // Safe zone padding for maskable

  // Colors
  const darkBlue = [15, 23, 42]; // #0f172a
  const midBlue = [30, 58, 138];  // #1e3a8a
  const brightBlue = [37, 99, 235]; // #2563eb
  const gold = [245, 158, 11];    // #f59e0b
  const cyan = [56, 189, 248];    // #38bdf8
  const white = [255, 255, 255];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = (x - center) / center;
      const dy = (y - center) / center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient
      const t = (x + y) / (size * 2);
      let r = Math.round(darkBlue[0] * (1 - t) + midBlue[0] * t * 0.5 + brightBlue[0] * t * 0.5);
      let g = Math.round(darkBlue[1] * (1 - t) + midBlue[1] * t * 0.5 + brightBlue[1] * t * 0.5);
      let b = Math.round(darkBlue[2] * (1 - t) + midBlue[2] * t * 0.5 + brightBlue[2] * t * 0.5);
      let a = 255;

      // In non-maskable, make squircle or circular rounded edges
      if (!isMaskable) {
        const cornerDist = Math.pow(Math.abs(dx), 4) + Math.pow(Math.abs(dy), 4);
        if (cornerDist > 0.85) {
          a = Math.max(0, Math.min(255, Math.round((1 - cornerDist) / 0.15 * 255)));
        }
      }

      // Draw Academic Cap Geometry
      // Center cap coordinates mapped to scale
      const scale = isMaskable ? 0.65 : 0.8;
      const nx = (x - center) / (center * scale);
      const ny = (y - center) / (center * scale) + 0.1; // slight offset

      // Diamond Top of Cap: |nx| / 1.0 + |ny + 0.2| / 0.4 < 1
      const inCapTop = (Math.abs(nx) / 0.85 + Math.abs(ny + 0.15) / 0.35) <= 1.0;
      // Skull band
      const inSkullBand = (Math.abs(nx) <= 0.45) && (ny >= 0.05 && ny <= 0.45);
      // AI Sparkle Star at center
      const inSparkle = (Math.pow(Math.abs(nx), 0.5) + Math.pow(Math.abs(ny + 0.15), 0.5)) <= 0.35;
      // Chevron wings at bottom
      const inChevron = Math.abs(ny - (0.55 + Math.abs(nx) * 0.25)) < 0.08 && Math.abs(nx) < 0.65;

      if (inSparkle) {
        r = gold[0]; g = gold[1]; b = gold[2];
      } else if (inCapTop) {
        const topGrad = (nx + 1) / 2;
        r = Math.round(cyan[0] * (1 - topGrad) + white[0] * topGrad * 0.4);
        g = Math.round(cyan[1] * (1 - topGrad) + white[1] * topGrad * 0.4);
        b = Math.round(cyan[2] * (1 - topGrad) + white[2] * topGrad * 0.4);
      } else if (inSkullBand) {
        r = 30; g = 41; b = 59;
      } else if (inChevron) {
        r = gold[0]; g = gold[1]; b = gold[2];
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return png;
}

// Generate 192x192, 512x512, maskable 512x512, and apple-touch-icon 180x180
const p192 = renderPng(192, false);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), PNG.sync.write(p192));

const p512 = renderPng(512, false);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), PNG.sync.write(p512));

const pMaskable = renderPng(512, true);
fs.writeFileSync(path.join(iconsDir, 'maskable-512.png'), PNG.sync.write(pMaskable));

const pApple = renderPng(180, false);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), PNG.sync.write(pApple));
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), PNG.sync.write(pApple));

console.log('PWA icons generated successfully!');
