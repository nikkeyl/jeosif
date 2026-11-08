# JEOSIF

Japanese contractions, colloquial forms, and slang with Russian
explanations. The dictionary connects forms such as `あざす` and
`ありがとうございます`, separates their meanings, and explains when a form
is appropriate.

Download `JEOSIF.zip` from
[Releases](https://github.com/nikkeyl/jeosif/releases/latest) and import it
as a dictionary in Yomitan or Naminori. The archive contains structured
definitions, examples, source records, and attested pitch accents. Audio is
provided by the dictionary client; no recordings are bundled.

> [!IMPORTANT]
>
> This collection was assembled with AI assistance. Japanese usage,
> register, translations, and examples still need linguistic review.
> Automated checks validate the build and data structure; they do not
> establish language accuracy.

## Build locally

Python 3.11 or newer is sufficient. No packages, database, or network access
are needed for the build.

```sh
python3 scripts/build.py
python3 scripts/check.py dist/JEOSIF.zip
```

Run the reproducibility and invalid-input checks before opening a pull
request:

```sh
python3 scripts/check.py
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

The builder in `scripts/build.py` creates the Yomitan v3 archive from this
snapshot. `scripts/render.py` renders shared structured content with text
markers understood by Naminori. External research archives and unaccepted
candidates are excluded from the repository and release build. Import and
rendering in actual clients should be checked after changing the export
format.

See [Contributing](CONTRIBUTING.md) to suggest entries, correct Japanese or
Russian, or change the exporter. Issues may be written in English, Japanese,
or Russian.

## Releases

`Check` builds the dictionary on pushes and pull requests, checks the
archive, and verifies that repeated builds produce identical bytes. After a
successful push check on `main`, `Release` rebuilds that exact commit and
publishes `JEOSIF.zip` and its SHA-256 checksum under
`jeosif-<short commit>`.

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
