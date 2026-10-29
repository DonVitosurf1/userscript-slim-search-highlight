# Security model

[Documentation](README.md) · [Report a vulnerability](../SECURITY.md)

## Webpage boundary

The userscript runs in the manager's isolated DOM/content world. Metadata requests `@sandbox DOM` and `@inject-into content`; page-world injection is not a supported security configuration. UI references stay in a private closure. A closed shadow tree reduces direct DOM access and host CSS interference, but **closed Shadow DOM is not a confidentiality boundary**: native browser search can inspect its text, including collapsed sections.

For that reason, the panel renders only saved keywords whose domain restrictions permit the current hostname. Keywords belonging solely to another domain and the full search history are never rendered into this page. Recent searches are available through the userscript manager's own menu; choosing one explicitly applies it to the current page.

**Globally applicable keywords are observable by sites they apply to.** Highlighting modifies those sites' text, and the panel can display applicable keyword strings or regex patterns. Native search may observe these strings even when a disclosure is closed. Turning highlighting off or closing/minimizing the panel is not a way to make a globally applicable keyword confidential. Use domain restrictions for terms that should not apply elsewhere. Browser-page UI is also not a place to enter passwords or other credentials; an untrusted host can observe ordinary keyboard interaction.

Privileged UI activations and global editing shortcuts reject synthetic events. Existing keyword edits require explicit Save or Enter; native editing followed by blur cannot silently persist a change. Native browser editing APIs may affect an unsaved draft, so review a draft before explicitly saving. Genuine document marks carry the identity of their original saved keyword in a private WeakMap; DOM classes/data attributes and automatic search terms cannot select another saved profile for deletion.

## Downloads and clipboard

JSON/Markdown exports use `GM_download`. The script never inserts an export link or its Blob URL into the host document. A successful download, error, or timeout revokes the temporary URL. If the manager does not support this secure download path, the script reports the limitation instead of falling back to a page-visible export. Grant download permission when the userscript manager requests it.

Copy actions require a real activation of the selection toolbar. The copied quote is the user's selection on the current page. Clipboard denial offers a private UI field for manual copying; no automatic clipboard read or upload is implemented.

## Text and regex input

Search-query, URL-fragment and result-handoff terms are always literal text, including slash-delimited strings. Only explicitly saved user keywords may use regex syntax. Empty Unicode matches advance a full code point.

Explicit regex support is deliberately conservative: at most 256 source code units, one variable repetition, one alternation scope, repetition bounds at most 100 and a combined fixed-bound budget of 1,000. Backreferences, nested repetitions, repeated alternatives, quantified assertions and the `v` flag are rejected. Regex matching skips individual text nodes longer than 4,096 UTF-16 code units; literal keywords still process those nodes.

This is a bounded native-regex subset, **not** an unrestricted regex engine with a worker timeout or a formal guarantee for every possible pattern. Complex expressions may require simplification. Existing unsupported saved expressions are retained but skipped with an error; they are not silently rewritten or deleted.

## Domains and storage

Ordinary domain scopes use normalized hostname equality or a real dot-subdomain boundary. Search capture uses a finite list of official provider domains, rather than matching a provider's name anywhere in the hostname.

Saved-page records, global preferences and recent searches remain local GM data. Full URL keys and exports can contain private text or query parameters. Search-handoff TTL limits use, not immediate physical deletion. See the [data format](data-format.md) for retention and concurrency details.

## Verification and limits

`security-ui` tests use Chromium isolated worlds, real closed roots and simulated manager APIs. They cover direct DOM access, native search, native editing/blur, synthetic actions, forged/mutated marks, cross-domain automatic-mark collisions and real export clicks. The normal functional/screenshot fixture uses an explicitly open test root only for inspection; it never overrides `isTrusted`. That adapter is not included in the shipped userscript and is never used by the isolated-world security suite.

Real Tampermonkey/Violentmonkey sandbox and download compatibility still needs manual release verification. No webpage script can guarantee control over hostile page rendering, clickjacking, browser bugs or a compromised userscript manager. Installed updates come from GitHub `main`; repository access controls are part of the trust model.
