import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build, load, root, validate } from './build.mjs';

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
  const index = JSON.parse(read('index.json'));
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
    build(a);
    build(b);
    assert.deepEqual(
      readFileSync(a),
      readFileSync(b),
      'Build is not reproducible',
    );
    check(a);
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
