# Attribution

JEOSIF combines selected source evidence, adapted definitions, and editorial
Japanese–Russian learning material. It was assembled with AI assistance;
"reviewed" fields inherited from the initial collection describe selection
by the earlier build process, not independent expert certification.

## JMdict

© James William Breen and the Electronic Dictionary Research and Development
Group.
[JMdict](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project)
data is used under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The
[EDRDG license statement](licenses/EDRDG-LICENCE.html) is preserved.

JEOSIF selects relevant senses, supplies Russian explanations and examples,
groups related forms, and renders a subset rather than the full dictionary.
Entry IDs, selected senses, and the original source SHA-256 are retained in
`data/dictionary.json` under `jmdict_evidence`. Source refreshes are
reviewed separately, as described in the contribution guide.

## Japanese Wiktionary

Japanese Wiktionary contributors,
[CC BY-SA 4.0](https://ja.wiktionary.org/wiki/Wiktionary:著作権). The
Japanese Wiktionary snapshot was extracted through
[Kaikki](https://kaikki.org/dictionary/Japanese/). Individual article links,
snapshot dates, and hashes are retained in each `source_evidence` record.
Article history pages identify the original contributors. JEOSIF selects
forms and senses and adds Russian explanations; it does not reproduce whole
articles.

## Kanjium pitch accents

The pitch accent notation was provided by Uros O. through his free
[Kanjium database](https://github.com/mifunetoshiro/kanjium), CC BY-SA 4.0.
The original license text is in `licenses/KANJIUM-LICENSE.txt`.

The snapshot commit and SHA-256 are recorded in `pronunciation_audit`.
JEOSIF matches selected spellings and readings, creates kana aliases,
excludes ambiguous slang homonyms, and exports Yomitan pitch metadata.
Missing or ambiguous accents are not inferred.

## Kolobok and Jitendex

Russian definitions and example translations from
[Kolobok](https://ganqqwerty.github.io/jp-ru-kolobok-dictionary/), Russian
edition by Yuri Katkov, based on Jitendex by Stephen Kraus. The upstream
notice specifies CC BY-SA 4.0 for the dictionary and CC BY 2.0 FR for
Tatoeba example sentences. The notice is preserved in
`licenses/KOLOBOK-ATTRIBUTION.txt`.

JEOSIF selects 30 articles from the recorded initial snapshot, preserves
sense and example boundaries, adds context and variant-specific notes, and
reformats the content. `kolobok_audit` records the revision, archive
SHA-256, selected article IDs, and available example sentence IDs.

## Tatoeba examples

Japanese example sentences inherited through Kolobok/Jitendex are attributed
to the [Tatoeba contributors](https://tatoeba.org/), under the upstream
[CC BY 2.0 FR license](https://creativecommons.org/licenses/by/2.0/fr/).
Individual sentence links and author attribution links are listed below.
Sentence IDs are also preserved in the source senses. Russian translations
inherited from Kolobok retain the Russian edition's attribution; editorial
translations and examples are part of the CC BY-SA 4.0 collection.
- [Sentence 76353 and its contributor](https://tatoeba.org/en/sentences/show/76353).
- [Sentence 76517 and its contributor](https://tatoeba.org/en/sentences/show/76517).
- [Sentence 80651 and its contributor](https://tatoeba.org/en/sentences/show/80651).
- [Sentence 104385 and its contributor](https://tatoeba.org/en/sentences/show/104385).
- [Sentence 160617 and its contributor](https://tatoeba.org/en/sentences/show/160617).
- [Sentence 197945 and its contributor](https://tatoeba.org/en/sentences/show/197945).
- [Sentence 198028 and its contributor](https://tatoeba.org/en/sentences/show/198028).
- [Sentence 217285 and its contributor](https://tatoeba.org/en/sentences/show/217285).
- [Sentence 223306 and its contributor](https://tatoeba.org/en/sentences/show/223306).
- [Sentence 230375 and its contributor](https://tatoeba.org/en/sentences/show/230375).
- [Sentence 237511 and its contributor](https://tatoeba.org/en/sentences/show/237511).
- [Sentence 2280958 and its contributor](https://tatoeba.org/en/sentences/show/2280958).
- [Sentence 95000 and its contributor](https://tatoeba.org/en/sentences/show/95000).

## Other references

Research links in `sources`, `restoration_evidence`, and
`external_surface_matches` are evidence links, not blanket permission to
copy the referenced dictionaries. Surface matches do not assert agreement of
senses. Proprietary source archives, Warodai, client source code, and the
separate Living Japanese Slang dataset are not included in this release.
