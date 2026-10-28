const normalizedNodeCache = new WeakMap();
function* normalizedNode(node) {
    const raw = node.data;
    const cached = normalizedNodeCache.get(node);
    if (cached?.raw === raw) return cached;
    const pieces = [], parts = [];
    let length = 0, previousSpace = false;
    for (let start = 0; start < raw.length; start += 8192) {
        const chunk = raw.slice(start, start + 8192);
        let text = chunk.replace(/\s+/g, ' ');
        const skipLeading = previousSpace && text.startsWith(' ');
        if (skipLeading) text = text.slice(1);
        if (text) {
            const piece = { start: length, rawStart: start, skipLeading, starts: null, ends: null };
            if (text.length !== chunk.length) {
                piece.starts = []; piece.ends = [];
                for (const token of chunk.matchAll(/\s+|[^\s]/g)) {
                    piece.starts.push(token.index); piece.ends.push(token.index + token[0].length);
                }
            }
            pieces.push(piece); parts.push(text); length += text.length;
            previousSpace = text.endsWith(' ');
        }
        if (start + 8192 < raw.length) yield;
    }
    const value = {
        raw, text: parts.join(''),
        point(offset, end) {
            if (length === raw.length) return offset + (end ? 1 : 0);
            let lo = 0, hi = pieces.length - 1;
            while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (pieces[mid].start <= offset) lo = mid; else hi = mid - 1; }
            const piece = pieces[lo];
            const local = offset - piece.start + (piece.skipLeading ? 1 : 0);
            return piece.rawStart + (piece.starts ? (end ? piece.ends[local] : piece.starts[local]) : local + (end ? 1 : 0));
        }
    };
    normalizedNodeCache.set(node, value);
    return value;
}

function* pageTextIndex(root = document.body) {
    let text = '', previousBlock = null, previousNode = null;
    const segments = [], styles = new Map();
    const style = el => {
        if (!styles.has(el)) styles.set(el, getComputedStyle(el));
        return styles.get(el);
    };
    const visible = el => {
        for (; el; el = el.parentElement) {
            const css = style(el);
            if (el.hidden || css.display === 'none' || css.visibility !== 'visible' || css.contentVisibility === 'hidden') return false;
        }
        return true;
    };
    const blockDisplays = new Set(['block', 'flow-root', 'flex', 'grid', 'list-item', 'table', 'table-row', 'table-cell', 'table-caption']);
    const walker = root && document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let node, processed = 0;
    while (walker && (node = walker.nextNode())) {
        if (++processed % 128 === 0) yield;
        if (node.nodeType === 1) {
            if (previousNode && ['BR', 'HR'].includes(node.tagName) && !node.closest(SKIP_SELECTOR + ', ' + OWN_UI) && visible(node) && !/[\s\0]$/.test(text)) {
                segments.push({ start: text.length, node: previousNode, synthetic: true }); text += ' ';
            }
            continue;
        }
        const parent = node.parentElement;
        if (!parent || !visible(parent)) continue; // Invisible inline text creates no rendered boundary.
        if (parent.closest(SKIP_SELECTOR + ', ' + OWN_UI)) {
            if (text && !text.endsWith('\0')) text += '\0';
            previousBlock = null; continue;
        }
        let block = parent;
        while (block && !blockDisplays.has(style(block).display)) block = block.parentElement;
        const value = yield* normalizedNode(node);
        let normalized = value.text;
        if (!normalized) continue;
        if (previousNode && block !== previousBlock && !/[\s\0]$/.test(text)) {
            segments.push({ start: text.length, node: previousNode, synthetic: true }); text += ' ';
        }
        const skipLeading = text.endsWith(' ') && normalized.startsWith(' ');
        if (skipLeading) normalized = normalized.slice(1);
        if (normalized) {
            segments.push({ start: text.length, node, skipLeading, value }); text += normalized;
        }
        previousBlock = block; previousNode = node;
    }
    function point(index, end) {
        let lo = 0, hi = segments.length - 1;
        while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (segments[mid].start <= index) lo = mid; else hi = mid - 1; }
        const segment = segments[lo];
        if (segment.synthetic) return [segment.node, segment.node.length];
        const offset = index - segment.start + (segment.skipLeading ? 1 : 0);
        return [segment.node, segment.value.point(offset, end)];
    }
    return { text, point };
}

function* collectPageMatches(root) {
    const { text, point } = yield* pageTextIndex(root);
    const found = [];
    let operations = 0;
    for (const term of pageTerms) {
        const escaped = escapeRegExp(term.text);
        const pattern = pageOptions.wholeWords ? '(?<![\\p{L}\\p{N}_])' + escaped + '(?![\\p{L}\\p{N}_])' : escaped;
        for (const match of text.matchAll(new RegExp(pattern, 'giu'))) {
            found.push({ start: match.index, end: match.index + match[0].length, term });
            if (++operations % 128 === 0) yield;
        }
    }
    found.sort((a, b) => a.start - b.start || b.end - a.end);
    let end = -1;
    const matches = [];
    for (const match of found) {
        if (match.start < end) continue;
        const start = point(match.start, false), finish = point(match.end - 1, true);
        if (!start[0].isConnected || !finish[0].isConnected || start[1] > start[0].length || finish[1] > finish[0].length) continue;
        const range = document.createRange(); range.setStart(...start); range.setEnd(...finish);
        matches.push({ range, id: match.term.id, term: match.term.text, color: match.term.color, text: text.slice(match.start, match.end), prefix: text.slice(Math.max(0, match.start - 40), match.start).replace(/\0/g, ' '), suffix: text.slice(match.end, match.end + 40).replace(/\0/g, ' '), context: text.slice(Math.max(0, match.start - 36), Math.min(text.length, match.end + 48)).replace(/\0/g, ' ') });
        end = match.end;
        if (++operations % 128 === 0) yield;
    }
    return matches;
}
function paintPageMatches(matches) {
    clearPagePaint(false);
    pageMatches = matches;
    pageCounts = new Map();
    const base = new Highlight(), groups = new Map();
    for (const match of matches) {
        base.add(match.range);
        pageCounts.set(match.id, (pageCounts.get(match.id) || 0) + 1);
        if (!groups.has(match.id)) groups.set(match.id, new Highlight());
        groups.get(match.id).add(match.range);
    }
    CSS.highlights.set('slim-page', base);
    const rules = [];
    for (const term of pageTerms) {
        const name = 'slim-page-term-' + term.id;
        const paint = groups.get(term.id);
        if (!paint) continue;
        paint.priority = 1; CSS.highlights.set(name, paint); pagePaintNames.add(name);
        rules.push(`::highlight(${name}) { background-color: ${term.color}; color: ${highlightTextColor(term.color)}; }`);
        const first = matches.find(match => match.id === term.id);
        if (!term.anchor && first) term.anchor = { exact: term.text, prefix: first.prefix, suffix: first.suffix };
    }
    let style = document.getElementById('slim-page-colors');
    if (!style) { style = document.createElement('style'); style.id = 'slim-page-colors'; document.head.append(style); }
    style.textContent = rules.join('\n');
    if (pageMatches.length && (currentIdx < 0 || currentIdx >= pageMatches.length)) currentIdx = 0;
}
function rebuildPageMatches() {
    resetPageIdentity(); pageTextDirty = false;
    const generation = ++pageSearchGeneration, identity = location.href;
    if (!pageTerms.length || !enabled || isBlacklisted() || !supportsPageHighlights()) { clearPagePaint(); renderPageList(); return; }
    const work = collectPageMatches(searchRoot());
    let asynchronous = false;
    pageSearchBusy = true; renderSearchState();
    function step() {
        if (generation !== pageSearchGeneration || identity !== location.href || !enabled || isBlacklisted()) return;
        const deadline = performance.now() + 10;
        let result;
        do { result = work.next(); } while (!result.done && performance.now() < deadline);
        if (!result.done) { asynchronous = true; requestAnimationFrame(step); return; }
        paintPageMatches(result.value); pageSearchBusy = false; renderPageList();
        if (asynchronous) { updateCounterAndTitle(); renderMatchList(); updatePosBar(); }
    }
    step();
}
