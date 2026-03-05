#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function printUsage() {
  console.log(`Usage:
  GEMINI_API_KEY=... node tools/media/nano-banana-call.mjs \\
    --prompt "A futuristic office scene" \\
    [--model gemini-3.1-flash-image-preview] \\
    [--out outputs/nano-banana.png] \\
    [--input ./ref.jpg] \\
    [--mime image/jpeg]

Notes:
  - No --input: text-to-image
  - With --input: image edit (text + image)
`);
}

function getArg(name, fallback = '') {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeInlineData(part) {
  if (!part || typeof part !== 'object') return null;
  return part.inlineData || part.inline_data || null;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = getArg('--prompt');
  const model = getArg('--model', 'gemini-3.1-flash-image-preview');
  const out = getArg('--out', 'outputs/nano-banana.png');
  const input = getArg('--input');
  const mime = getArg('--mime', 'image/jpeg');

  if (!apiKey || !prompt) {
    printUsage();
    if (!apiKey) console.error('Missing GEMINI_API_KEY');
    if (!prompt) console.error('Missing --prompt');
    process.exit(1);
  }

  const parts = [{ text: prompt }];

  if (input) {
    const bytes = fs.readFileSync(input);
    parts.push({
      inline_data: {
        mime_type: mime,
        data: bytes.toString('base64')
      }
    });
  }

  const body = {
    contents: [{ parts }]
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Request failed: ${response.status} ${response.statusText}`);
    console.error(text);
    process.exit(1);
  }

  const data = await response.json();
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];

  if (!candidates.length) {
    console.error('No candidates returned. Full response:');
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const partsOut = candidates[0]?.content?.parts || [];
  let imgCount = 0;

  for (const [i, part] of partsOut.entries()) {
    if (part.text) {
      console.log(`[text ${i}] ${part.text}`);
      continue;
    }

    const inline = normalizeInlineData(part);
    if (inline?.data) {
      imgCount += 1;
      const ext = (inline.mimeType || inline.mime_type || 'image/png').split('/')[1] || 'png';
      const file =
        imgCount === 1
          ? out
          : out.replace(/\.[a-zA-Z0-9]+$/, `-${imgCount}.${ext}`);

      ensureDir(file);
      fs.writeFileSync(file, Buffer.from(inline.data, 'base64'));
      console.log(`[image ${imgCount}] saved: ${file}`);
    }
  }

  if (!imgCount) {
    console.error('No image bytes found in response. Full response:');
    console.error(JSON.stringify(data, null, 2));
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
