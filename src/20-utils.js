const ICONS = {
    save: '<path d="m5 12 4 4L19 6"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
    bookmarked: '<path d="M6 3h12v18l-6-4-6 4V3Z" fill="currentColor"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="m3 3 18 18M10.5 5.1 12 5c6.5 0 10 7 10 7a21 21 0 0 1-3 3.8M6.1 6.1A21 21 0 0 0 2 12s3.5 7 10 7a12 12 0 0 0 5.8-1.6M10 10a3 3 0 0 0 4 4"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    minus: '<path d="M5 12h14"/>',
    expand: '<path d="M5 8h14v10H5zM5 5h14"/>',
    prev: '<path d="m14 6-6 6 6 6"/>', next: '<path d="m10 6 6 6-6 6"/>',
    highlight: '<path d="m4 16 9-11 6 6-11 9H4v-4Z M11 7l6 6 M3 22h15"/>',
    reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>'
};
const icon = name => INLINE_ICONS[name] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let removedKeyword = null;
let composing = false;
let panelSizeObserver = null;
let highlightGeneration = 0;
let ownedMarkKeywords = new WeakMap();

function highlightHex(color) {
    const hex = String(color).replace('#', '');
    const expanded = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    return /^[0-9a-f]{6}$/i.test(expanded) ? '#' + expanded.toLowerCase() : null;
}
function linearHighlightRGB(color) {
    const hex = highlightHex(color);
    return hex && [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
}
function highlightTextColor(color) {
    const rgb = linearHighlightRGB(color);
    if (!rgb) return COLORS.contrast.dark;
    const luminance = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
    return (luminance + .05) / .05 >= 1.05 / (luminance + .05) ? COLORS.contrast.dark : COLORS.contrast.light;
}

// OKLab coordinates make tone separation comparable across different hues.
function highlightColorPoint(color) {
    const rgb = linearHighlightRGB(color);
    if (!rgb) return null;
    const [r, g, b] = rgb;
    const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b);
    const m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b);
    const s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    return [.2104542553 * l + .793617785 * m - .0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + .4505937099 * s,
        .0259040371 * l + .7827717662 * m - .808675766 * s];
}
const highlightColorFamily = COLORS.highlights.flatMap(base => {
    const rgb = base.slice(1).match(/../g).map(value => parseInt(value, 16));
    return [.15, .3, .45, .6].flatMap(level => [255, 0].map(endpoint => {
        const color = '#' + rgb.map(value => Math.round(value + (endpoint - value) * level).toString(16).padStart(2, '0')).join('');
        return { color, point: highlightColorPoint(color) };
    }));
}).filter(({ point: [l, a, b] }) => l >= .58 && l <= .92 && Math.hypot(a, b) >= .06);

function highlightColorDistance(a, b) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}
function createHighlightColorAllocator(occupiedColors) {
    const used = new Set([...occupiedColors].map(highlightHex).filter(Boolean));
    const points = [...used].map(highlightColorPoint);
    const score = candidates => candidates.filter(({ color }) => !used.has(color)).map(candidate => {
        let distance = Infinity;
        for (const point of points) distance = Math.min(distance, highlightColorDistance(candidate.point, point));
        return { ...candidate, distance };
    });
    let candidates = score(highlightColorFamily), nextRGBStep = 1;
    const occupy = color => {
        used.add(color);
        const point = highlightColorPoint(color); points.push(point);
        // Only the new color can reduce each remaining candidate's distance.
        for (const candidate of candidates) candidate.distance = Math.min(candidate.distance, highlightColorDistance(candidate.point, point));
        return color;
    };
    return () => {
        const starter = COLORS.highlights.find(color => !used.has(color));
        if (starter) return occupy(starter);
        if (!candidates.some(candidate => !used.has(candidate.color))) {
            const extra = [];
            // Score a bounded batch once; keep unused candidates for subsequent terms.
            while (nextRGBStep <= 0xffffff && extra.length < 128) {
                const value = Math.imul(nextRGBStep++, 0x9e3779) & 0xffffff;
                const rgb = [value >>> 16, (value >>> 8) & 255, value & 255];
                if (Math.max(...rgb) < 240 || Math.max(...rgb) - Math.min(...rgb) < 128) continue;
                const color = '#' + value.toString(16).padStart(6, '0');
                if (!used.has(color)) extra.push({ color, point: highlightColorPoint(color) });
            }
            candidates = score(extra);
        }
        let best = null;
        for (const candidate of candidates) {
            if (!used.has(candidate.color) && (!best || candidate.distance > best.distance)) best = candidate;
        }
        return best ? occupy(best.color) : COLORS.highlights[0];
    };
}
function chooseHighlightColor(occupiedColors) {
    return createHighlightColorAllocator(occupiedColors)();
}
