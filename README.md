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

All build and validation logic lives directly in
`.github/workflows/check.yaml`. GitHub Actions runs it on every pull request
and push to `main`. Download the dictionary artifact from a successful
`Check` run to try a change before release.

The workflow installs exact versions of Ajv and its dependencies in the
runner's temporary directory. It fetches the official Yomitan schemas from a
pinned commit and verifies their SHA-256 hashes before validation. These
tools and schemas are not stored in the repository.

## Editing the dictionary

Edit `data/dictionary.json`. Each entry groups related forms, Russian
meanings, usage notes, examples, and evidence. Keep an entry's numeric ID
when correcting it. `search_metadata` records tags and inflection rules for
each indexed form; new forms need a matching metadata entry.

Full expressions, word-formation bases, and standalone slang are
distinguished explicitly. An etymological component is not indexed under a
slang word's meaning. Missing pitch data stays missing, rather than becoming
accent `[0]`.

The `Build and Check Dictionary` step creates the Yomitan v3 archive and
renders structured content with text markers understood by Naminori.
External research archives and unaccepted candidates are excluded from the
repository and build. Check import and rendering in actual clients after
changing the export format.

See [Contributing](CONTRIBUTING.md) to suggest entries, correct Japanese or
Russian, or change the exporter. Issues may be written in English, Japanese,
or Russian.

## Releases

`Check` builds the dictionary on pushes and pull requests, checks the
archive against the official Yomitan schemas, and verifies that repeated
builds produce identical bytes. After a successful push check on `main`,
`Release` downloads the artifact from that exact successful `Check` run and
publishes `JEOSIF.zip`, its SHA-256 checksum, and `index.json` under
`JEOSIF-<short commit>`.

`indexUrl` points to the latest release's `index.json`. Its `downloadUrl`
points to the ZIP in that exact release. The index inside the ZIP and the
published index are identical. Yomitan uses the increasing numeric `Check`
workflow run number as `revision`; commit hashes are used only for release
tags and titles. Update checks and installation are controlled by the
client. The workflow uploads all assets as a draft before publishing the
release.

Release builds use only committed data. Updating upstream sources is a
separate reviewed change; a release never downloads fresh definitions
automatically.

## License and sources

Workflow code and project documentation are [MIT licensed](LICENSE).
Dictionary data and its rendered definitions use
[CC BY-SA 4.0](DATA-LICENSE.md), with separate attribution retained for
upstream examples. MIT does not relicense third-party data.
[Attribution](ATTRIBUTION.md) records JMdict, Japanese Wiktionary, Kanjium,
Kolobok/Jitendex, and Tatoeba, including source identifiers and changes.

Validation uses the unmodified
[official Yomitan schemas](https://github.com/yomidevs/yomitan/tree/ee81f8dcf13e985bb4d7961009fb49a764b4d924/ext/data/schemas),
fetched only while Actions runs. Community templates are adapted from
[Archoleat](https://github.com/archoleat/.github), with the
[original MIT notice](.github/ARCHOLEAT-TEMPLATES-LICENSE) preserved.
