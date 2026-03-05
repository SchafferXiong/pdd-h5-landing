import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { repoRoot, paths } from './shared/paths.mjs';

const OLD_VARIANTS = [
  'frontend-designer',
  'ui-designer',
  'ux-designer',
  'frontend-design-masterclass',
  'v2-hybrid',
  'v3-replica',
  'v3',
  'kuaishou-v1',
  'qianwen-v1',
  'qianwen-v2-1-office10min',
  'qianwen-v2-3-office-cinematic',
  'qianwen-v3-1-ai-office-shock',
  'qianwen-v3-2-ai-office-direct',
  'qianwen-v3-3-magazine-pop'
];

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const baseUrl = String(cli['base-url'] || 'http://127.0.0.1:4173');
  const probeUrl = `${baseUrl.replace(/\/$/, '')}/apps/h5-main/index.html`;

  const serverHandle = await ensureLocalPreviewServer(probeUrl, repoRoot);

  const failures = [];
  const checks = [];

  try {
    const landingIds = await readLandingIds();
    for (const id of landingIds) {
      const legacyUrl = `${baseUrl.replace(/\/$/, '')}/generated_landings/${id}/index.html`;
      const canonicalUrl = `${baseUrl.replace(/\/$/, '')}/artifacts/landings/${id}/index.html`;
      checks.push(await checkHttp(legacyUrl, failures, `legacy landing ${id}`));
      checks.push(await checkHttp(canonicalUrl, failures, `canonical landing ${id}`));
    }

    for (const variant of OLD_VARIANTS) {
      const legacyCompareUrl = `${baseUrl.replace(/\/$/, '')}/compare/output/${variant}/index.html`;
      checks.push(await checkHttp(legacyCompareUrl, failures, `legacy compare variant ${variant}`));
    }

    const pathChecks = await verifyAuditRecordedLocalPaths();
    checks.push(...pathChecks.results);
    failures.push(...pathChecks.failures);
  } finally {
    if (serverHandle) {
      serverHandle.kill('SIGTERM');
    }
  }

  const passed = failures.length === 0;
  const summary = {
    passed,
    totalChecks: checks.length,
    passedChecks: checks.filter((c) => c.ok).length,
    failedChecks: failures.length,
    failures
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!passed) {
    process.exitCode = 1;
  }
}

async function readLandingIds() {
  if (!existsSync(paths.artifactsLandingsDir)) return [];
  const entries = await fs.readdir(paths.artifactsLandingsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('landing-'))
    .map((entry) => entry.name)
    .sort();
}

async function verifyAuditRecordedLocalPaths() {
  const failures = [];
  const results = [];
  const auditRoot = paths.artifactsAuditsDir;
  if (!existsSync(auditRoot)) return { failures, results };

  const allFiles = await walkFiles(auditRoot);
  const jsonFiles = allFiles.filter((file) => file.endsWith('.json'));
  const mdFiles = allFiles.filter((file) => file.endsWith('.md'));

  const pathSet = new Set();

  for (const file of jsonFiles) {
    const raw = await fs.readFile(file, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    collectValueByKey(parsed, 'targetLocalFilePath', pathSet);
    collectValueByKey(parsed, 'targetLocalFileUrl', pathSet);
  }

  for (const file of mdFiles) {
    const raw = await fs.readFile(file, 'utf8');
    const inlinePaths = raw.match(/file:\/\/[^\s`]+/g) || [];
    for (const value of inlinePaths) pathSet.add(value);

    const localPathMatches = raw.match(/`\/Users\/[^`]+`/g) || [];
    for (const wrapped of localPathMatches) {
      pathSet.add(wrapped.slice(1, -1));
    }
  }

  for (const rawValue of pathSet) {
    const value = String(rawValue || '').trim();
    if (!value) continue;

    const checkLabel = `audit-local-path ${value}`;
    let targetPath = value;
    if (value.startsWith('file://')) {
      try {
        targetPath = decodeURIComponent(new URL(value).pathname);
      } catch {
        failures.push(`${checkLabel} (invalid file url)`);
        results.push({ ok: false, label: checkLabel });
        continue;
      }
    }

    const ok = existsSync(targetPath);
    results.push({ ok, label: checkLabel });
    if (!ok) failures.push(`${checkLabel} (missing file)`);
  }

  return { failures, results };
}

function collectValueByKey(node, keyName, outSet) {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    for (const item of node) collectValueByKey(item, keyName, outSet);
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === keyName && typeof value === 'string' && value.trim()) {
      outSet.add(value.trim());
    }
    collectValueByKey(value, keyName, outSet);
  }
}

async function walkFiles(root) {
  const out = [];

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.resolve(current, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile()) {
        out.push(abs);
      }
    }
  }

  await walk(root);
  return out;
}

async function checkHttp(url, failures, label) {
  const ok = await pingUrl(url);
  if (!ok) failures.push(`${label}: ${url} (HTTP unreachable)`);
  return { ok, label, url };
}

async function ensureLocalPreviewServer(targetUrl, cwd) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return null;
  }

  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    return null;
  }

  const reachable = await pingUrl(targetUrl);
  if (reachable) return null;

  const port = Number(parsed.port || 80);
  const server = spawn('python3', ['-m', 'http.server', String(port)], {
    cwd,
    stdio: 'ignore'
  });

  const started = await waitUntil(async () => pingUrl(targetUrl), 7000, 280);
  if (!started) {
    server.kill('SIGTERM');
    throw new Error(`Cannot start local preview server: ${targetUrl}`);
  }

  return server;
}

async function pingUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function waitUntil(fn, timeoutMs, pollMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await fn();
    if (ok) return true;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  return false;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const [key, inlineValue] = token.slice(2).split('=');
    if (inlineValue !== undefined) {
      out[key] = inlineValue;
      continue;
    }

    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

main().catch((err) => {
  console.error('[verify-links] failed:', err?.message || err);
  process.exitCode = 1;
});
