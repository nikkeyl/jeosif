# Official Yomitan schemas

Unmodified JSON Schema draft-07 files from
[yomidevs/yomitan](https://github.com/yomidevs/yomitan/tree/ee81f8dcf13e985bb4d7961009fb49a764b4d924/ext/data/schemas),
commit `ee81f8dcf13e985bb4d7961009fb49a764b4d924`. Copyright Yomitan Authors
and Yomichan Authors; GPL-3.0-or-later. The upstream license is preserved in
`YOMITAN-LICENSE`.

`upstream.json` records the source commit and SHA-256 of each file. The
checker verifies those hashes before compiling the schemas with Ajv. To
update, fetch all four files from a reviewed upstream commit, refresh these
hashes and the commit reference, and run the existing checks. Keep upstream
schemas unchanged and preserve their license.
