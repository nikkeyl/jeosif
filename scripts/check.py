"""Check the actual distributable and prove the offline build is reproducible."""
import argparse
import copy
import json
import tempfile
import zipfile
from pathlib import Path

from build import ROOT, build, load, require, validate


def text(value):
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "".join(map(text, value))
    if isinstance(value, dict):
        return text(value.get("content", ""))
    return ""


def check(path):
    with zipfile.ZipFile(path) as archive:
        require(archive.testzip() is None, "Corrupt ZIP")
        require(all("/" not in n and "\\" not in n for n in archive.namelist()), "Unexpected archive path")
        for name in ["index.json", "term_bank_1.json", "term_meta_bank_1.json", "tag_bank_1.json",
                     "SOURCES.json", "ATTRIBUTION.md", "DATA-LICENSE.md", "CC-BY-SA-4.0.txt",
                     "KANJIUM-LICENSE.txt", "EDRDG-LICENCE.html"]:
            require(name in archive.namelist(), f"Missing {name}")
        index = json.loads(archive.read("index.json"))
        require(index["format"] == 3 and index["sourceLanguage"] == "ja"
                and index["targetLanguage"] == "ru", "Unexpected dictionary format/languages")
        terms = json.loads(archive.read("term_bank_1.json"))
        source = json.loads(archive.read("SOURCES.json"))
        keys = {(t[0], t[1]) for t in terms}
        require(len(keys) == len(terms), "Duplicate search records")
        for term in terms:
            require(len(term) == 8 and term[0] and term[1] and term[5], "Malformed term")
            require(all(g.get("type") == "structured-content" and text(g).strip() for g in term[5]),
                    f"Empty glossary: {term[0]}")
        for row in source["entries"]:
            require(all((v["form"], v["reading"]) in keys for v in row["variants"]),
                    f"Missing search variant: {row['headword']}")
        for word in ("ちゃう", "じゃう", "ちまう", "しちゃう"):
            term = next(t for t in terms if t[0] == word)
            require(term[3] == "v5u", f"Lost auxiliary inflection: {word}")
        standalone = [r for r in source["entries"] if r["full_form_status"] == "not_applicable"]
        for row in standalone:
            term = next(t for t in terms if t[0] == row["headword"])
            require("полной формы нет" in text(term[5]), f"Invented expansion: {row['headword']}")
        require("format-marker" in archive.read("styles.css").decode(), "Lost client markers")
    print(f"PASS: ZIP, metadata, {len(terms)} unique records, variant coverage, inflection and attribution")


def self_check():
    source = load(ROOT / "data/dictionary.json")
    tags = {t[0] for t in load(ROOT / "data/tag_bank_1.json")}
    for mutate in (lambda s: s["entries"].append(copy.deepcopy(s["entries"][0])),
                   lambda s: s["entries"][0].update(sources=["missing-source"]),
                   lambda s: s["entries"][0]["senses"][0].update(meaning="")):
        broken = copy.deepcopy(source)
        mutate(broken)
        try:
            validate(broken, tags)
        except ValueError:
            continue
        raise ValueError("Invalid source was accepted")
    with tempfile.TemporaryDirectory() as tmp:
        a, b = Path(tmp) / "a.zip", Path(tmp) / "b.zip"
        build(a)
        build(b)
        require(a.read_bytes() == b.read_bytes(), "Build is not reproducible")
        check(a)
    print("PASS: invalid contributions rejected; repeated builds are byte-identical")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", nargs="?", type=Path)
    args = parser.parse_args()
    check(args.archive) if args.archive else self_check()
