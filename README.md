# JEOSIF

**Japanese Everyday Short Forms** — a Japanese–Russian dictionary of
contractions, colloquial forms, and slang for Yomitan and Naminori.

JEOSIF connects a shortened expression to the fuller form it comes from.
Looking up `あざす` gives you both its meaning and the connection to
`ありがとうございます`, with Russian explanations of register and usage.
Entries bring related spellings together, distinguish meanings, and include
Japanese examples with Russian translations. Pitch accents are included
where source data is available.

## From full expression to slang

All of these forms express thanks, but they are not interchangeable in
every setting:

| Form | Reading | Register and use |
| --- | --- | --- |
| ありがとうございます | arigatō gozaimasu | Full expression; polite thanks. |
| ありがとう | arigatō | Plain, familiar thanks, without the polite ending. |
| あざっす | azassu | Strongly contracted, casual thanks in an informal group. |
| あざす | azasu | Another casual contraction of the full polite expression. |
| あざーす / あざーっす | azāsu / azāssu | Drawn-out, informal slang variants. |

This is a comparison of forms and register, not a sequence of historical
changes. `あざす` and `あざっす` are parallel contractions; neither needs to
have developed through `ありがとう`. Their relationship to a polite
expression does not make them suitable for formal thanks.

Not every slang word has an expandable full form. JEOSIF distinguishes
contractions, word-formation bases, and standalone expressions rather than
assigning an invented origin to each entry.

## Install

Download **JEOSIF.zip** from the
[latest release](https://github.com/nikkeyl/jeosif/releases/latest).
Keep the ZIP intact; do not extract it or download GitHub's source archive.

### Yomitan

1. Open Yomitan settings, then **Dictionaries → Configure installed and
   enabled dictionaries**.

1. Select **Import** and choose `JEOSIF.zip`.

1. Wait for the import to finish and make sure **JEOSIF** is enabled.

Use **Check for updates** in the dictionary manager to find new releases.
If you installed a version from before update support was added, import the
current ZIP once to enable update checks. See the
[Yomitan dictionary guide](https://yomitan.wiki/dictionaries/) for client
settings.

### Naminori browser extension

1. Open the extension's settings and find the dictionaries section.

1. Select **Свой словарь .zip** and choose `JEOSIF.zip`.

1. Make sure **JEOSIF** is enabled, then use **Гибрид** or
   **Только локальный** lookup mode.

Move JEOSIF above your general-purpose dictionary if you want its entries
to appear first. Imported dictionaries stay in that browser; they do not
sync to the Naminori desktop or phone apps. To update JEOSIF, import the ZIP
from a newer release.

> [!IMPORTANT]
>
> This collection was assembled with AI assistance. Japanese usage,
> register, translations, and examples still need linguistic review.

## Corrections and contributions

Found an incorrect origin, an unnatural example, or a missing form? Open an
issue with the expression, context, and a source where possible. English,
Japanese, and Russian are welcome.

See [Contributing](CONTRIBUTING.md) for entry conventions and source
requirements. Dictionary entries are maintained in `data/dictionary.json`.

## License and sources

Dictionary data and its rendered definitions use
[CC BY-SA 4.0](DATA-LICENSE.md), with separate attribution retained for
upstream examples. [Attribution](ATTRIBUTION.md) records JMdict, Japanese
Wiktionary, Kanjium, Kolobok/Jitendex, and Tatoeba, including source
identifiers and changes.

Workflow code and project documentation are [MIT licensed](LICENSE).
MIT does not relicense third-party data.
