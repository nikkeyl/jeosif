# JEOSIF

JEOSIF takes its name from **Japanese Everyday Short Forms**.

Japanese contractions, colloquial forms, and slang with Russian
explanations. The dictionary connects forms such as `あざす` and
`ありがとうございます`, separates their meanings, and explains when a form
is appropriate.

Download `JEOSIF.zip` from
[Releases](https://github.com/nikkeyl/jeosif/releases/latest) and import it
as a dictionary in Yomitan or Naminori. Import the new ZIP once to enable
Yomitan update checks for installations made before update metadata was
added. The archive contains structured definitions, examples, source
records, and attested pitch accents. Audio is provided by the dictionary
client; no recordings are bundled.

> [!IMPORTANT]
>
> This collection was assembled with AI assistance. Japanese usage,
> register, translations, and examples still need linguistic review.
> Automated checks validate the build and data structure; they do not
> establish language accuracy.

## Build and checks

GitHub Actions runs the JavaScript builder and checks on every pull request
and push to `main`. Download the ZIP from the successful `Check` run for a
preview; the `Release` workflow publishes the checked commit from `main`.
The Actions runner supplies Node.js, `zip`, and `unzip`. Ajv is installed
from the locked check dependencies in `.github`.

To reproduce the same commands locally with Node.js 24 and Info-ZIP:

```sh
npm ci --prefix .github --ignore-scripts

node .github/scripts/build.mjs
node .github/scripts/check.mjs dist/JEOSIF.zip
node .github/scripts/check.mjs
```

## Editing the dictionary

Edit `data/dictionary.json`. Each entry groups related forms, Russian
meanings, usage notes, examples, and evidence. Keep an entry's numeric ID
when correcting it. `search_metadata` records tags and inflection rules for
each indexed form; new forms need a matching metadata entry.

Full expressions, word-formation bases, and standalone slang are
distinguished explicitly. An etymological component is not indexed under a
slang word's meaning. Missing pitch data stays missing, rather than becoming
accent `[0]`.

The builder in `.github/scripts/build.mjs` creates the Yomitan v3 archive
from this snapshot. `.github/scripts/render.mjs` renders shared structured
content with text markers understood by Naminori. External research archives
and unaccepted candidates are excluded from the repository and release
build. Import and rendering in actual clients should be checked after
changing the export format.

See [Contributing](CONTRIBUTING.md) to suggest entries, correct Japanese or
Russian, or change the exporter. Issues may be written in English, Japanese,
or Russian.

## Releases

`Check` builds the dictionary on pushes and pull requests, checks the
archive against the official Yomitan schemas, and verifies that repeated
builds produce identical bytes. After a successful push check on `main`,
`Release` rebuilds that exact commit and publishes `JEOSIF.zip`, its SHA-256
checksum, and `index.json` under `JEOSIF-<short commit>`.

`indexUrl` points to the latest release's `index.json`. Its `downloadUrl`
points to the ZIP in that exact release. The index inside the ZIP and the
published index are identical. Yomitan uses the increasing numeric release
workflow run number as `revision`; commit hashes are used only for release
tags and titles. Update checks and installation are controlled by the
client. The workflow uploads all assets as a draft before publishing the
release.

Release builds use only committed data. Updating upstream sources is a
separate reviewed change; a release never downloads fresh definitions
automatically.

## License and sources

Build scripts and project documentation are [MIT licensed](LICENSE).
Dictionary data and its rendered definitions use
[CC BY-SA 4.0](DATA-LICENSE.md), with separate attribution retained for
upstream examples. MIT does not relicense third-party data.
[Attribution](ATTRIBUTION.md) records JMdict, Japanese Wiktionary, Kanjium,
Kolobok/Jitendex, and Tatoeba, including source identifiers and changes.

Official Yomitan schemas in `.github/schemas` retain their upstream
[GPL-3.0-or-later license](.github/schemas/YOMITAN-LICENSE). Community
templates are adapted from
[Archoleat](https://github.com/archoleat/.github), with the
[original MIT notice](.github/ARCHOLEAT-TEMPLATES-LICENSE) preserved.
