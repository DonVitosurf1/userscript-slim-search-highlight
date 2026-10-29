import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Offline, dependency-free checks for common credential formats. Findings contain
// only paths and rule names; never print source lines, matches, or Git output.
const maxBytes = 16 * 1024 * 1024;
const findings = new Set();
const rules = [
  ['private-key', /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{60,255})\b/],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['google-api-key', /\bAIza[A-Za-z0-9_-]{35}\b/],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{20,255}\b/],
  ['stripe-secret-key', /\b[rs]k_live_[A-Za-z0-9]{16,255}\b/],
  ['openai-api-key', /\bsk-(?:(?:proj|svcacct)-)?[A-Za-z0-9_-]{40,255}\b/],
  ['assigned-secret', /\b(?:api[_-]?(?:key|secret)|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|(?:aws[_-]?)?secret[_-]?(?:access[_-]?)?key)["']?\s*[=:]\s*["'][A-Za-z0-9_+\/.=-]{24,}["']/i],
  ['url-credentials', /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]{8,}@/i],
];

function report(filename, rule, history = false) {
  findings.add(`${JSON.stringify(filename)}: ${rule}${history ? ' (history)' : ''}`);
}

function scan(filename, data, history = false) {
  const basename = path.posix.basename(filename);
  const example = /(?:^|[._-])(?:example|sample|template)(?:$|[._-])/i.test(basename);
  if (!example && (/^\.env(?:\.|$)/i.test(basename)
    || /^(?:credentials(?:\.json)?|service-account[^/]*\.json|id_(?:rsa|dsa|ecdsa|ed25519))$/i.test(basename)
    || /\.(?:p12|pfx|key)$/i.test(basename))) {
    report(filename, 'credential-file', history);
  }
  if (data.includes(0)) return; // Binary key containers are covered by filename.
  const text = data.toString('utf8');
  for (const [name, pattern] of rules) if (pattern.test(text)) report(filename, name, history);
}

try {
  if (process.argv.slice(2).some(arg => arg !== '--history')) {
    throw new Error('usage');
  }
  const git = (args, options = {}) => execFileSync('git', args, {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'], ...options,
  });
  const root = git(['rev-parse', '--show-toplevel']).trim();
  const files = new Set(git(['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean));
  for (const filename of files) {
    const fullPath = path.join(root, filename);
    let stat;
    try { stat = lstatSync(fullPath); } catch (error) {
      if (error.code === 'ENOENT') continue; // A tracked file deleted locally.
      throw error;
    }
    if (!stat.isFile()) continue; // Never follow symlinks outside the repository.
    if (stat.size > maxBytes) throw new Error('oversize');
    scan(filename, readFileSync(fullPath));
  }
  if (process.argv.includes('--history')) {
    if (git(['-C', root, 'rev-parse', '--is-shallow-repository']).trim() === 'true') {
      throw new Error('shallow');
    }
    const objects = git(['-C', root, 'rev-list', '--objects', '--all']).trim().split('\n').filter(Boolean);
    const names = new Map(objects.map(line => {
      const space = line.indexOf(' ');
      return space < 0 ? [line, line] : [line.slice(0, space), line.slice(space + 1)];
    }));
    const details = git(['-C', root, 'cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], {
      input: [...names.keys()].join('\n') + '\n',
    });
    for (const detail of details.trim().split('\n').filter(Boolean)) {
      const [oid, type, size] = detail.split(' ');
      if (type !== 'blob') continue;
      if (Number(size) > maxBytes) throw new Error('oversize');
      const data = git(['-C', root, 'cat-file', 'blob', oid], { encoding: 'buffer' });
      scan(names.get(oid), data, true);
    }
  }
  if (findings.size) {
    console.error('Potential credentials found (values redacted):');
    for (const finding of [...findings].sort()) console.error(finding);
    process.exitCode = 1;
  } else console.log(`Secret checks passed${process.argv.includes('--history') ? ' (working tree and reachable Git history)' : ' (working tree)'}.`);
} catch (error) {
  const messages = {
    usage: 'Usage: node scripts/check-secrets.mjs [--history]',
    oversize: 'Secret scan incomplete: a file exceeds the 16 MiB scan limit. Review it before changing the limit.',
    shallow: 'History scan requires a full clone. Run git fetch --unshallow, then retry.',
  };
  console.error(messages[error.message] || 'Secret scan incomplete: unable to read repository files or Git objects.');
  process.exitCode = 2;
}
