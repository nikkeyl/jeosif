# Contributing

Corrections to Japanese usage, Russian explanations, and source attribution
are welcome. A small, well-supported correction is easier to review than a
large imported word list. You can open an issue without running the builder.

## Propose a dictionary change

1. Identify the entry ID or propose a new, unused numeric ID.

1. Provide the spelling, reading, intended meaning, register, and a natural
   example with its Russian translation. Explain which context the example
   fits.

1. Link evidence for that specific sense. A matching spelling in another
   dictionary does not establish the same meaning.

1. Record the source, author where supplied, license, and entry or sentence
   ID when adapting third-party material. Explain what you changed.

1. Update `data/dictionary.json`, including `search_metadata` for added
   forms. Use only tags defined in `data/tag_bank_1.json`; extend the tag
   bank when a new tag is needed. Use `rules: ""` unless inflection is
   explicitly supported.

1. Open a pull request and wait for the existing `Check` workflow. The
   workflow builds and validates the archive; download its artifact to check
   the result in a dictionary client.

A full form must be attested, not invented from a possible etymology. Keep
independent slang as `full: null` with `full_form_status: "not_applicable"`.
A word-formation base uses `word_formation_base`; it is not a synonymous
full expression. Existing spellings and readings should not silently lose
meanings.

AI-assisted contributions are accepted. Disclose their use and verify claims
against the cited evidence. Do not describe generated examples as corpus
citations or infer pitch accent from spelling or synthetic speech.

## Source updates

Keep release builds offline. Compare updated upstream records with the
selected senses, preserve identifiers and hashes, and submit source updates
as a pull request. Review JMdict evidence when refreshing the underlying
dataset; its license statement requires a regular update procedure. Do not
overwrite local editorial decisions with an unreviewed bulk import.

Only submit original text or material whose license permits adaptation and
redistribution under the project's data terms. A public webpage alone is not
permission to copy its definitions. Do not import Warodai text, the separate
Living Japanese Slang collection, proprietary archives, or client
application code into this dataset without a compatible license review.

## Export changes

The checks cover malformed input, duplicate IDs/search records, source
references, required metadata, archive integrity, auxiliary inflection, and
reproducibility, official Yomitan schemas, and matching update metadata.
They do not simulate the clients. After changing structured content, test
the ZIP in both Yomitan and Naminori and describe the client versions and
observed behavior in the pull request. Do not commit generated ZIPs; Actions
attaches them to the run and release.

Use a Conventional Commit title such as
`fix: correct the register of あざす` or
`feat: add an attested contraction`. Contributions to code and project
documentation use MIT; original dictionary contributions use CC BY-SA 4.0.
Retain all applicable third-party notices and example licenses.
