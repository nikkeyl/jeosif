import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { root, load } from './build.mjs';

const directory = join(root, '.github/schemas');
const upstream = load(join(directory, 'upstream.json'));
// Official schemas use valid draft-07 constructs outside Ajv's optional strict subset.
const ajv = new Ajv({ strict: false, allErrors: true });
const validators = new Map();
for (const [name, digest] of Object.entries(upstream.files)) {
  const bytes = readFileSync(join(directory, name));
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    digest,
    `Changed official schema: ${name}; refresh upstream.json with the source commit`,
  );
  validators.set(name, ajv.compile(JSON.parse(bytes)));
}

export function validateSchema(name, value) {
  const validate = validators.get(name);
  assert(validate, `Unknown official schema: ${name}`);
  assert(
    validate(value),
    `${name}: ${ajv.errorsText(validate.errors, { separator: '\n' })}`,
  );
}

export function checkSchemas(names, read) {
  for (const name of names) {
    let schema;
    if (name === 'index.json') schema = 'dictionary-index-schema.json';
    else if (/^term_bank_\d+\.json$/.test(name))
      schema = 'dictionary-term-bank-v3-schema.json';
    else if (/^term_meta_bank_\d+\.json$/.test(name))
      schema = 'dictionary-term-meta-bank-v3-schema.json';
    else if (/^tag_bank_\d+\.json$/.test(name))
      schema = 'dictionary-tag-bank-v3-schema.json';
    if (schema) validateSchema(schema, JSON.parse(read(name)));
  }
  console.log(
    `PASS: official Yomitan schemas at ${upstream.commit.slice(0, 12)}`,
  );
}
