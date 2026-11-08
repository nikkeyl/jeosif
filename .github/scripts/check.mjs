import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { build, load, root, validate } from './build.mjs';
import { checkSchemas, validateSchema } from './schemas.mjs';

function text(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(text).join('');
  return value && typeof value === 'object'
    ? text(value.content ?? '')
    : '';
}

function check(path) {
  path = resolve(path);
  execFileSync('unzip', ['-t', path], { stdio: 'pipe' });
  const names = execFileSync('unzip', ['-Z1', path], { encoding: 'utf8' })
    .trim()
    .split('\n');
  assert(
    names.every((name) => !/[\\/]/.test(name)),
    'Unexpected archive path',
  );
  for (const name of [
    'index.json',
    'term_bank_1.json',
    'term_meta_bank_1.json',
    'tag_bank_1.json',
    'SOURCES.json',
    'ATTRIBUTION.md',
    'DATA-LICENSE.md',
    'CC-BY-SA-4.0.txt',
    'KANJIUM-LICENSE.txt',
    'EDRDG-LICENCE.html',
  ]) {
    assert(names.includes(name), `Missing ${name}`);
  }
  const read = (name) =>
    execFileSync('unzip', ['-p', path, name], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
  checkSchemas(names, read);
  const index = JSON.parse(read('index.json'));
  assert.equal(index.isUpdatable, true, 'Updates must be enabled');
  assert.equal(
    index.indexUrl,
    'https://github.com/nikkeyl/jeosif/releases/latest/download/index.json',
  );
  assert(
    index.downloadUrl.startsWith(
      'https://github.com/nikkeyl/jeosif/releases/',
    ),
    'Unexpected update host',
  );
  const publishedIndex = join(dirname(path), 'index.json');
  if (existsSync(publishedIndex)) {
    assert.deepEqual(
      load(publishedIndex),
      index,
      'Published index differs from the ZIP',
    );
  }
  assert(
    index.format === 3 &&
      index.sourceLanguage === 'ja' &&
      index.targetLanguage === 'ru',
    'Unexpected dictionary format/languages',
  );
  const terms = JSON.parse(read('term_bank_1.json'));
  const source = JSON.parse(read('SOURCES.json'));
  const keys = new Set(
    terms.map((term) => JSON.stringify(term.slice(0, 2))),
  );
  assert.equal(keys.size, terms.length, 'Duplicate search records');
  for (const term of terms) {
    assert(
      term.length === 8 && term[0] && term[1] && term[5].length,
      'Malformed term',
    );
    assert(
      term[5].every(
        (g) => g.type === 'structured-content' && text(g).trim(),
      ),
      `Empty glossary: ${term[0]}`,
    );
  }
  for (const row of source.entries) {
    assert(
      row.variants.every((v) =>
        keys.has(JSON.stringify([v.form, v.reading])),
      ),
      `Missing search variant: ${row.headword}`,
    );
    if (row.full_form_status === 'not_applicable') {
      assert(
        text(terms.find((t) => t[0] === row.headword)?.[5]).includes(
          'полной формы нет',
        ),
        `Invented expansion: ${row.headword}`,
      );
    }
  }
  for (const word of ['ちゃう', 'じゃう', 'ちまう', 'しちゃう']) {
    assert.equal(
      terms.find((term) => term[0] === word)?.[3],
      'v5u',
      `Lost auxiliary inflection: ${word}`,
    );
  }
  assert(
    read('styles.css').includes('format-marker'),
    'Lost client markers',
  );
  console.log(
    `PASS: ZIP, metadata, ${terms.length} unique records, variant coverage, inflection and attribution`,
  );
}

function selfCheck() {
  const source = load(join(root, 'data/dictionary.json'));
  const tags = new Set(
    load(join(root, 'data/tag_bank_1.json')).map((tag) => tag[0]),
  );
  for (const mutate of [
    (s) => s.entries.push(structuredClone(s.entries[0])),
    (s) => {
      s.entries[0].sources = ['missing-source'];
    },
    (s) => {
      s.entries[0].senses[0].meaning = '';
    },
  ]) {
    const broken = structuredClone(source);
    mutate(broken);
    assert.throws(
      () => validate(broken, tags),
      'Invalid source was accepted',
    );
  }
  const directory = mkdtempSync(join(tmpdir(), 'jeosif-check-'));
  try {
    const a = join(directory, 'a.zip');
    const b = join(directory, 'b.zip');
    build(a, '1', 'JEOSIF-1111111');
    build(b, '1', 'JEOSIF-1111111');
    assert.deepEqual(
      readFileSync(a),
      readFileSync(b),
      'Build is not reproducible',
    );
    check(a);
    const index = load(join(directory, 'index.json'));
    const missingUrl = { ...index };
    delete missingUrl.indexUrl;
    assert.throws(() =>
      validateSchema('dictionary-index-schema.json', missingUrl),
    );
    const invalidTerms = [
      [
        'word',
        'reading',
        '',
        '',
        0,
        [
          {
            type: 'structured-content',
            content: { tag: 'script', content: 'invalid' },
          },
        ],
        -1,
        '',
      ],
    ];
    assert.throws(() =>
      validateSchema('dictionary-term-bank-v3-schema.json', invalidTerms),
    );
    build(b, '2', 'JEOSIF-2222222');
    const updated = load(join(directory, 'index.json'));
    assert(
      Number(updated.revision) > Number(index.revision),
      'Update revision did not increase',
    );
    assert.equal(
      updated.indexUrl,
      index.indexUrl,
      'Update index URL must stay stable',
    );
    assert(
      updated.downloadUrl.includes('/JEOSIF-2222222/'),
      'ZIP must match the indexed release',
    );
    check(b);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  console.log(
    'PASS: invalid contributions rejected; repeated builds are byte-identical',
  );
}

assert(
  process.argv.length <= 3,
  'Usage: node .github/scripts/check.mjs [archive]',
);
if (process.argv[2]) check(process.argv[2]);
else selfCheck();
