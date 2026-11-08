import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { render } from './render.mjs';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function validate(source, tags) {
  assert.equal(source.title, 'JEOSIF', 'Unexpected dictionary title');
  assert.equal(
    source.license,
    'CC BY-SA 4.0',
    'Keep the dictionary data license',
  );
  assert(source.entries.length, 'The dictionary must not be empty');
  const ids = new Set();
  for (const row of source.entries) {
    const label = `Entry ${row.id} (${row.headword})`;
    assert(!ids.has(row.id), `${label}: duplicate ID`);
    ids.add(row.id);
    assert(
      row.sources.length &&
        row.sources.every((key) => Object.hasOwn(source.sources, key)),
      `${label}: provide valid sources`,
    );
    assert(
      row.senses.length && row.variants.length,
      `${label}: provide meanings and forms`,
    );
    assert(
      row.full_form_status !== 'not_applicable' || row.full === null,
      `${label}: independent slang has no expanded form`,
    );
    for (const sense of row.senses) {
      assert(
        typeof sense.meaning === 'string' && sense.meaning.trim(),
        `${label}: empty meaning`,
      );
      assert.equal(
        Boolean(sense.example),
        Boolean(sense.example_ru),
        `${label}: incomplete example`,
      );
    }
    const forms = [...row.variants];
    if (row.full && row.full_form_status !== 'word_formation_base') {
      forms.push({ form: row.full, reading: row.reading });
    }
    for (const variant of forms) {
      assert(variant.form && variant.reading, `${label}: empty form`);
      const metadata = row.search_metadata[variant.form];
      assert(
        metadata.tags.every((tag) => tags.has(tag)),
        `${label}: undefined tag`,
      );
      assert(
        ['', 'v5u'].includes(metadata.rules),
        `${label}: unsupported inflection rule`,
      );
    }
  }
  for (const reference of Object.values(source.sources)) {
    assert(
      /^https?:\/\//.test(reference.url),
      'Source URLs must use HTTP(S)',
    );
  }
}

export function termBank(source) {
  const terms = new Map();
  const families = new Map();
  for (const row of source.entries) {
    const forms = [...row.variants];
    if (row.full && row.full_form_status !== 'word_formation_base') {
      forms.unshift({
        form: row.full,
        reading: row.reading,
        romaji: row.romaji,
        register: 'полная / стандартная форма',
      });
    }
    for (const variant of forms) {
      const metadata = row.search_metadata[variant.form];
      for (const expression of new Set([variant.form, variant.reading])) {
        const key = JSON.stringify([expression, variant.reading]);
        const card = render(row, { ...variant, form: expression });
        if (!terms.has(key)) {
          terms.set(key, [
            expression,
            variant.reading,
            metadata.tags.join(' '),
            metadata.rules,
            0,
            [card],
            -1,
            metadata.priority,
          ]);
          families.set(key, new Set([row.id]));
        } else if (!families.get(key).has(row.id)) {
          terms.get(key)[5].push(card);
          families.get(key).add(row.id);
        }
      }
    }
  }
  return [...terms.values()];
}

function pitchBank(source, terms) {
  const keys = new Set(
    terms.map((term) => JSON.stringify(term.slice(0, 2))),
  );
  const seen = new Set();
  return source.pronunciations.map((pitch) => {
    const key = JSON.stringify([pitch.expression, pitch.reading]);
    assert(keys.has(key) && !seen.has(key), `Invalid pitch record: ${key}`);
    seen.add(key);
    assert.equal(
      pitch.source,
      'kanjium',
      `Unattributed pitch record: ${key}`,
    );
    const morae = [...pitch.reading].filter(
      (char, index) =>
        !'ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ'.includes(char) ||
        index === 0,
    ).length;
    assert(
      pitch.positions.length &&
        pitch.positions.every(
          (p) => Number.isInteger(p) && p >= 0 && p <= morae,
        ),
      `Invalid accent: ${key}`,
    );
    return [
      pitch.expression,
      'pitch',
      {
        reading: pitch.reading,
        pitches: pitch.positions.map((position) => ({ position })),
      },
    ];
  });
}

export function build(
  destination = join(root, 'dist/JEOSIF.zip'),
  revision,
) {
  destination = resolve(destination);
  const source = load(join(root, 'data/dictionary.json'));
  const tags = load(join(root, 'data/tag_bank_1.json'));
  validate(source, new Set(tags.map((tag) => tag[0])));
  const terms = termBank(source);
  const index = load(join(root, 'data/index.json'));
  index.revision = revision ?? source.revision;
  assert(/^[A-Za-z0-9._-]+$/.test(index.revision), 'Unsafe revision');
  index.description =
    `${source.entries.length} families; ${terms.length} search records. ` +
    'Japanese contractions, colloquial forms and slang with Russian explanations.';
  index.url = 'https://github.com/nikkeyl/jeosif';
  const files = {
    'index.json': json(index),
    'term_bank_1.json': json(terms),
    'tag_bank_1.json': json(tags),
    'term_meta_bank_1.json': json(pitchBank(source, terms)),
    'SOURCES.json': json(source),
    'pronunciation-audit.json': json(source.pronunciation_audit),
    'styles.css': readFileSync(join(root, 'data/styles.css')),
    'README.txt':
      `JEOSIF ${index.revision}\n${source.entries.length} families; ${terms.length} search records.\n\n` +
      'Import JEOSIF.zip using the dictionary import screen in Yomitan or Naminori.\n' +
      'Audio comes from the client; this archive contains no recordings.\n' +
      'A missing pitch accent is unknown, not necessarily accent [0].\n' +
      'This AI-assisted collection still needs linguistic review.\n\n' +
      'See ATTRIBUTION.md and DATA-LICENSE.md for credits and reuse terms.\n' +
      'Source and corrections: https://github.com/nikkeyl/jeosif\n',
  };
  for (const name of readdirSync(join(root, 'licenses'))) {
    files[name] = readFileSync(join(root, 'licenses', name));
  }
  for (const name of ['ATTRIBUTION.md', 'LICENSE', 'DATA-LICENSE.md']) {
    files[name] = readFileSync(join(root, name));
  }
  const directory = mkdtempSync(join(tmpdir(), 'jeosif-build-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const path = join(directory, name);
      writeFileSync(path, content);
      chmodSync(path, 0o644);
      utimesSync(
        path,
        new Date('1980-01-01T00:00:00Z'),
        new Date('1980-01-01T00:00:00Z'),
      );
    }
    // Info-ZIP is supplied by the Actions runner; -X excludes host-specific extra fields.
    execFileSync(
      'zip',
      ['-X', '-q', '-9', 'JEOSIF.zip', ...Object.keys(files).sort()],
      { cwd: directory, env: { ...process.env, TZ: 'UTC' } },
    );
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(directory, 'JEOSIF.zip'), destination);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  const digest = createHash('sha256')
    .update(readFileSync(destination))
    .digest('hex');
  writeFileSync(
    `${destination}.sha256`,
    `${digest}  ${destination.split(/[\\/]/).at(-1)}\n`,
  );
  console.log(
    `Built ${destination}: ${source.entries.length} families, ${terms.length} records`,
  );
  return terms;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  let output;
  let revision;
  while (args.length) {
    const flag = args.shift();
    assert(
      ['--output', '--revision'].includes(flag) && args.length,
      `Unknown or incomplete option: ${flag}`,
    );
    if (flag === '--output') output = args.shift();
    else revision = args.shift();
  }
  build(output, revision);
}
