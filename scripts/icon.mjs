// Генерация иконки бота 512×512 из SVG-кустика (полный расцвет).
// Запуск: node scripts/icon.mjs → assets/bot-icon.png
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Лепестковый цветок.
const flower = (x, y, r, petal, center) => {
  const pts = [
    [0, -r * 1.13],
    [r * 1.07, -r * 0.35],
    [r * 0.65, r],
    [-r * 0.65, r],
    [-r * 1.07, -r * 0.35],
  ];
  return `<g transform="translate(${x},${y})">${pts
    .map(([px, py]) => `<circle cx="${px}" cy="${py}" r="${r}" fill="${petal}"/>`)
    .join('')}<circle r="${r * 0.78}" fill="${center}"/></g>`;
};

const leaf = (cx, cy, rx, ry, rot) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#6E9C63" stroke="rgba(56,74,42,0.10)" stroke-width="1" transform="rotate(${rot} ${cx} ${cy})"/>`;

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#F8EFE0"/>
    <stop offset="100%" stop-color="#F0E2CB"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="42%" r="55%">
    <stop offset="0%" stop-color="#F7E3A4"/>
    <stop offset="55%" stop-color="#EAD6A8" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="#EAD6A8" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="512" height="512" rx="96" fill="url(#bg)"/>
<circle cx="256" cy="240" r="220" fill="url(#glow)"/>
<g transform="translate(66,30) scale(1.9)">
  <ellipse cx="100" cy="208" rx="46" ry="7" fill="rgba(74,55,40,0.10)"/>
  <path d="M42 58 l2 6.4 6.4 2 -6.4 2 -2 6.4 -2 -6.4 -6.4 -2 6.4 -2 z" fill="#F4C56A"/>
  <path d="M160 72 l1.7 5.4 5.4 1.7 -5.4 1.7 -1.7 5.4 -1.7 -5.4 -5.4 -1.7 5.4 -1.7 z" fill="#ECA0B8"/>
  <path d="M150 40 l1.4 4.4 4.4 1.4 -4.4 1.4 -1.4 4.4 -1.4 -4.4 -4.4 -1.4 4.4 -1.4 z" fill="#F4C56A"/>
  <path d="M100 150 C 97 120 103 92 100 60" stroke="#5E8A4F" stroke-width="5" stroke-linecap="round" fill="none"/>
  ${leaf(84, 134, 13, 6.5, -40)}
  ${leaf(116, 134, 13, 6.5, 40)}
  ${leaf(79, 112, 13, 6.5, -30)}
  ${leaf(121, 112, 13, 6.5, 30)}
  ${leaf(82, 90, 12, 6, -22)}
  ${leaf(118, 90, 12, 6, 22)}
  ${leaf(89, 69, 11, 5.5, -12)}
  ${leaf(111, 69, 11, 5.5, 12)}
  ${flower(100, 52, 4.6, '#EC9BB4', '#F4C56A')}
  ${flower(85, 63, 4.1, '#F0B36A', '#C56A4B')}
  ${flower(115, 63, 4.1, '#EC9BB4', '#F4C56A')}
  <path d="M70 150 L130 150 L122 202 Q121 206 117 206 L83 206 Q79 206 78 202 Z" fill="#C56A4B"/>
  <path d="M76 152 L83 152 L79 201 L74 200 Z" fill="rgba(255,255,255,0.13)"/>
  <rect x="64" y="143" width="72" height="13" rx="6.5" fill="#B65C3E"/>
  <circle cx="90" cy="174" r="3.7" fill="#4A3328"/>
  <circle cx="110" cy="174" r="3.7" fill="#4A3328"/>
  <circle cx="80" cy="183" r="5" fill="#E98AA6"/>
  <circle cx="120" cy="183" r="5" fill="#E98AA6"/>
  <path d="M84 186 Q100 198 116 186" stroke="#4A3328" stroke-width="2.6" fill="none" stroke-linecap="round"/>
</g>
</svg>`;

const png = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } }).render().asPng();
const out = resolve('assets', 'bot-icon.png');
writeFileSync(out, png);
console.log(`[icon] записан ${out} (${(png.length / 1024).toFixed(0)} КБ)`);
