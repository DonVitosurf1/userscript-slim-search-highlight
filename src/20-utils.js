const ICONS = {
    save: '<path d="m5 12 4 4L19 6"/>',
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

function highlightTextColor(color) {
    const hex = String(color).replace('#', '');
    const normalized = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    if (!/^[0-9a-f]{6}$/i.test(normalized)) return '#000';
    const rgb = [0, 2, 4].map(i => parseInt(normalized.slice(i, i + 2), 16) / 255)
        .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    const luminance = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
    return (luminance + .05) / .05 >= 1.05 / (luminance + .05) ? '#000' : '#fff';
}
