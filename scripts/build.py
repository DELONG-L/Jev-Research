#!/usr/bin/env python3
"""Build the static research page using only files in this repository."""

import argparse
import base64
import hashlib
import json
import re
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
CSS = ["styles.css", "interactions.css", "controls.css", "i18n.css"]
JS = ["i18n.js", "app.js", "interactions.js"]


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        for name in ["href", "src"]:
            if attrs.get(name):
                self.links.append(attrs[name])


def digest(content):
    return hashlib.sha256(content).hexdigest()


def render():
    config = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
    provenance = json.loads((ROOT / "data/provenance.json").read_text(encoding="utf-8"))
    raw_data = (ROOT / "data/explorer-data.json").read_bytes()
    assert digest(raw_data) == provenance["data_sha256"], "Update provenance when changing the public data snapshot."
    data = json.loads(raw_data)
    fonts = {}
    for name, expected in provenance["fonts"].items():
        raw = (ROOT / "assets/fonts" / name).read_bytes()
        assert digest(raw) == expected, f"Font snapshot mismatch: {name}"
        fonts[name] = base64.b64encode(raw).decode("ascii")

    translations = {}
    for name in ["translations.zh.json", "workflows.zh.json"]:
        translations.update(json.loads((ROOT / "src" / name).read_text(encoding="utf-8")))
    page = (ROOT / "src/index.template.html").read_text(encoding="utf-8")
    replacements = {
        "__APP_STYLES__": "\n".join((ROOT / "src" / name).read_text(encoding="utf-8") for name in CSS),
        "__APP_SCRIPT__": "\n".join((ROOT / "src" / name).read_text(encoding="utf-8") for name in JS),
        "__TRANSLATIONS_ZH__": json.dumps(translations, ensure_ascii=False).replace("<", "\\u003c"),
        "__PUBLIC_DATA__": json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c"),
        "__SANS_FONT__": fonts["plex-sans.woff2"],
        "__MONO_FONT__": fonts["plex-mono.woff2"],
    }
    for token, value in replacements.items():
        assert token in page, f"Missing template token: {token}"
        page = page.replace(token, value)
    assert not re.search(r"__[A-Z_]+__", page), "Unresolved template placeholder"

    url = escape(config["url"], quote=True)
    metadata = (
        f'<link rel="canonical" href="{url}">\n'
        f'<link rel="alternate" hreflang="en" href="{url}?lang=en">\n'
        f'<link rel="alternate" hreflang="zh-CN" href="{url}?lang=zh">\n'
        f'<link rel="alternate" hreflang="x-default" href="{url}">\n'
    )
    page = page.replace("</head>", metadata + "</head>")
    outputs = {
        "index.html": page.encode("utf-8"),
        "explorer-data.json": raw_data,
        ".nojekyll": b"",
        "fonts-license.txt": (ROOT / "assets/fonts/OFL.txt").read_bytes(),
    }

    links = Links()
    links.feed(page)
    for reference in links.links:
        parts = urlsplit(reference)
        if parts.scheme or parts.netloc:
            continue
        assert not parts.path.startswith("/"), f"Root-relative URL breaks project Pages: {reference}"
        if parts.path:
            assert unquote(parts.path) in outputs, f"Missing static asset: {reference}"
        if parts.fragment and not parts.path:
            assert parts.fragment in links.ids, f"Missing anchor: {reference}"
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check that committed docs match the editable source.")
    args = parser.parse_args()
    outputs = render()
    docs = ROOT / "docs"
    if args.check:
        for name, content in outputs.items():
            assert (docs / name).is_file() and (docs / name).read_bytes() == content, f"Rebuild docs/{name}"
        actual = {str(p.relative_to(docs)) for p in docs.rglob("*") if p.is_file()}
        assert actual == set(outputs), f"Unexpected published files: {actual - set(outputs)}"
        print("PASS: generated page, public data, font license, anchors and project-relative assets.")
    else:
        docs.mkdir(exist_ok=True)
        for name, content in outputs.items():
            (docs / name).write_bytes(content)
        print(f"Built {len(outputs)} files in docs/; public data SHA-256: {digest(outputs['explorer-data.json'])}")


if __name__ == "__main__":
    main()
