"""Build a reproducible, offline Yomitan v3 dictionary from reviewed data."""
import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path

from render import universal_card

ROOT = Path(__file__).resolve().parents[1]


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate(source, tags):
    require(source["title"] == "JEOSIF", "Unexpected dictionary title")
    require(source["license"] == "CC BY-SA 4.0", "Keep the dictionary data license")
    require(source["entries"], "The dictionary must not be empty")
    ids = set()
    for row in source["entries"]:
        label = f"Entry {row['id']} ({row['headword']})"
        require(row["id"] not in ids, f"{label}: duplicate ID")
        ids.add(row["id"])
        require(row["sources"], f"{label}: provide supporting sources")
        require(set(row["sources"]) <= source["sources"].keys(), f"{label}: unknown source")
        require(row["senses"], f"{label}: provide at least one meaning")
        require(row["variants"], f"{label}: provide a searchable form")
        require(row["full_form_status"] != "not_applicable" or row["full"] is None,
                f"{label}: independent slang has no expanded form")
        for sense in row["senses"]:
            require(isinstance(sense["meaning"], str) and sense["meaning"].strip(),
                    f"{label}: empty meaning")
            require(bool(sense.get("example")) == bool(sense.get("example_ru")),
                    f"{label}: examples need Japanese and Russian text")
        forms = list(row["variants"])
        if row["full"] and row["full_form_status"] != "word_formation_base":
            forms.append({"form": row["full"], "reading": row["reading"]})
        for variant in forms:
            require(bool(variant["form"]) and bool(variant["reading"]), f"{label}: empty form")
            meta = row["search_metadata"][variant["form"]]
            require(set(meta["tags"]) <= tags, f"{label}: undefined tag")
            require(meta["rules"] in ("", "v5u"), f"{label}: unsupported inflection rule")
    for item in source["sources"].values():
        require(item["url"].startswith(("https://", "http://")), "Source URLs must use HTTP(S)")


def term_bank(source):
    terms, families = {}, {}
    for row in source["entries"]:
        forms = list(row["variants"])
        if row["full"] and row["full_form_status"] != "word_formation_base":
            forms.insert(0, dict(form=row["full"], reading=row["reading"],
                                 romaji=row["romaji"], register="полная / стандартная форма"))
        for variant in forms:
            meta = row["search_metadata"][variant["form"]]
            tags = " ".join(meta["tags"])
            for expression in dict.fromkeys((variant["form"], variant["reading"])):
                key = (expression, variant["reading"])
                card = universal_card(row, dict(variant, form=expression), source, tags)
                if key not in terms:
                    terms[key] = [expression, variant["reading"], tags, meta["rules"], 0,
                                  [card], -1, meta["priority"]]
                    families[key] = {row["id"]}
                elif row["id"] not in families[key]:
                    terms[key][5].append(card)
                    families[key].add(row["id"])
    return list(terms.values())


def mora_count(reading):
    return sum(c not in "ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ" or i == 0
               for i, c in enumerate(reading))


def pitch_bank(source, terms):
    keys = {(t[0], t[1]) for t in terms}
    result = []
    seen = set()
    for pitch in source["pronunciations"]:
        key = (pitch["expression"], pitch["reading"])
        require(key in keys and key not in seen, f"Invalid pitch record: {key}")
        seen.add(key)
        require(pitch["source"] == "kanjium", f"Unattributed pitch record: {key}")
        require(pitch["positions"] and all(type(p) is int and 0 <= p <= mora_count(key[1])
                                          for p in pitch["positions"]), f"Invalid accent: {key}")
        result.append([key[0], "pitch", {"reading": key[1], "pitches":
                       [{"position": p} for p in pitch["positions"]]}])
    return result


def build(destination, revision=None):
    data = ROOT / "data"
    source = load(data / "dictionary.json")
    tags = load(data / "tag_bank_1.json")
    validate(source, {t[0] for t in tags})
    terms = term_bank(source)
    index = load(data / "index.json")
    index["revision"] = revision or source["revision"]
    require(re.fullmatch(r"[A-Za-z0-9._-]+", index["revision"]), "Unsafe revision")
    index["description"] = (f"{len(source['entries'])} families; {len(terms)} search records. "
                            "Japanese contractions, colloquial forms and slang with Russian explanations.")
    index["url"] = "https://github.com/nikkeyl/jeosif"
    encoded = lambda obj: (json.dumps(obj, ensure_ascii=False, indent=2) + "\n").encode()
    files = {
        "index.json": encoded(index), "term_bank_1.json": encoded(terms),
        "tag_bank_1.json": encoded(tags), "term_meta_bank_1.json": encoded(pitch_bank(source, terms)),
        "SOURCES.json": encoded(source), "pronunciation-audit.json": encoded(source["pronunciation_audit"]),
        "styles.css": (data / "styles.css").read_bytes(),
    }
    for path in sorted((ROOT / "licenses").iterdir()):
        files[path.name] = path.read_bytes()
    for name in ("ATTRIBUTION.md", "LICENSE", "DATA-LICENSE.md"):
        files[name] = (ROOT / name).read_bytes()
    files["README.txt"] = (
        f"JEOSIF {index['revision']}\n"
        f"{len(source['entries'])} families; {len(terms)} search records.\n\n"
        "Import JEOSIF.zip using the dictionary import screen in Yomitan or Naminori.\n"
        "Audio comes from the client; this archive contains no recordings.\n"
        "A missing pitch accent is unknown, not necessarily accent [0].\n"
        "This AI-assisted collection still needs linguistic review.\n\n"
        "See ATTRIBUTION.md and DATA-LICENSE.md for credits and reuse terms.\n"
        "Source and corrections: https://github.com/nikkeyl/jeosif\n"
    ).encode()
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, content in sorted(files.items()):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, content, compresslevel=9)
    digest = hashlib.sha256(destination.read_bytes()).hexdigest()
    destination.with_suffix(".zip.sha256").write_text(f"{digest}  {destination.name}\n")
    print(f"Built {destination}: {len(source['entries'])} families, {len(terms)} records")
    return terms


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "dist/JEOSIF.zip")
    parser.add_argument("--revision", help="Override the dictionary revision for a release")
    args = parser.parse_args()
    build(args.output, args.revision)
