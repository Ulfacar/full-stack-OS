"""Seed Trello board from docs/process/trello_seed_r1.md.

Usage:
    export TRELLO_API_KEY=...
    export TRELLO_TOKEN=...
    python scripts/seed_trello.py

Options:
    --board-name "Ex-Machina"     (default)
    --md docs/process/trello_seed_r1.md  (default)
    --dry-run                     (parse only, no API calls)
    --force-recreate              (delete existing board with same name; DANGEROUS)

Trello API: https://developer.atlassian.com/cloud/trello/rest/
Get key:   https://trello.com/app-key
Get token: click "Token" link on above page, authorize.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from dataclasses import dataclass, field
from typing import Optional

import requests


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TRELLO_BASE = "https://api.trello.com/1"

# Release bucket → Trello color
LABEL_COLORS = {
    "R1a": "red",
    "R1b": "orange",
    "R1c": "yellow",
    "R2": "sky",
    "R3": "purple",
    "$HIGH": "green",
    "$MED": "lime",
    "🔧 TD": "pink",
    "✅ Partial": "black",
}

LISTS = ["Backlog", "Sprint 0", "Sprint 1", "In Progress", "Review", "Done", "Blocked"]


@dataclass
class Card:
    release: str              # R1a | R1b | R1c | R2 | R3
    number: str               # #29
    title: str
    size: str = ""            # S | M | L
    money: str = ""           # High | Med | Low (display case)
    sprint: str = "-"         # 0 | 1 | N | -
    labels_extra: list[str] = field(default_factory=list)
    why: str = ""
    ac: list[str] = field(default_factory=list)
    ref: str = ""

    @property
    def target_list(self) -> str:
        if self.sprint == "0":
            return "Sprint 0"
        if self.sprint == "1":
            return "Sprint 1"
        return "Backlog"

    @property
    def display_labels(self) -> list[str]:
        out = [self.release]
        m = self.money.upper()
        if m == "HIGH":
            out.append("$HIGH")
        elif m == "MED":
            out.append("$MED")
        out.extend(self.labels_extra)
        return out

    def description(self) -> str:
        lines = []
        lines.append(f"**Size:** {self.size}   **$:** {self.money}   **Sprint:** {self.sprint}")
        if self.why:
            lines.append("")
            lines.append("## Why")
            lines.append(self.why)
        if self.ac:
            lines.append("")
            lines.append("## Acceptance Criteria")
            for item in self.ac:
                lines.append(f"- [ ] {item}")
        if self.ref:
            lines.append("")
            lines.append(f"**Ref:** {self.ref}")
        return "\n".join(lines)


def parse_md(path: str) -> list[Card]:
    text = open(path, encoding="utf-8").read()
    header_re = re.compile(r"^##\s+\[(R1a|R1b|R1c|R2|R3)\]\s+(#\d+)\s+(.+?)\s*$", re.MULTILINE)

    cards: list[Card] = []
    matches = list(header_re.finditer(text))
    for i, m in enumerate(matches):
        release, number, title = m.group(1), m.group(2), m.group(3).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end]

        card = Card(release=release, number=number, title=title)

        # metadata: inline or bullet form
        size_m = re.search(r"\*\*Size:\*\*\s*([SML])", body)
        if size_m:
            card.size = size_m.group(1)
        money_m = re.search(r"\*\*\$:\*\*\s*(HIGH|High|Med|Low)", body)
        if money_m:
            card.money = money_m.group(1)
        sprint_m = re.search(r"\*\*Sprint:\*\*\s*([^\s·\n]+)", body)
        if sprint_m:
            card.sprint = sprint_m.group(1)
        labels_m = re.search(r"\*\*Labels:\*\*\s*(.*?)$", body, re.MULTILINE)
        if labels_m:
            raw = labels_m.group(1).strip()
            card.labels_extra = [lab.strip() for lab in raw.split(",") if lab.strip()]

        # section: Why
        why_m = re.search(r"###\s+Why\s*\n(.+?)(?=\n###|\n##|\Z)", body, re.DOTALL)
        if why_m:
            card.why = why_m.group(1).strip()

        # section: AC
        ac_m = re.search(r"###\s+AC\s*\n(.+?)(?=\n###|\n##|\Z)", body, re.DOTALL)
        if ac_m:
            lines = [ln.strip() for ln in ac_m.group(1).splitlines()]
            card.ac = [
                ln.lstrip("- ").lstrip("[ ]").lstrip(" ")
                for ln in lines
                if ln.startswith("- [ ]") or ln.startswith("- [x]")
            ]

        # section: Ref
        ref_m = re.search(r"###\s+Ref\s*\n(.+?)(?=\n###|\n##|\Z)", body, re.DOTALL)
        if ref_m:
            card.ref = ref_m.group(1).strip()

        cards.append(card)

    return cards


class TrelloClient:
    def __init__(self, key: str, token: str):
        self.params = {"key": key, "token": token}

    def _req(self, method: str, path: str, **kwargs) -> dict:
        url = TRELLO_BASE + path
        merged = {**self.params, **kwargs.pop("params", {})}
        r = requests.request(method, url, params=merged, timeout=30, **kwargs)
        if not r.ok:
            raise RuntimeError(f"Trello {method} {path} failed: {r.status_code} {r.text[:500]}")
        return r.json() if r.text else {}

    def find_board(self, name: str) -> Optional[dict]:
        boards = self._req("GET", "/members/me/boards", params={"fields": "name,id,url,closed"})
        for b in boards:
            if b["name"] == name and not b.get("closed"):
                return b
        return None

    def delete_board(self, board_id: str):
        self._req("DELETE", f"/boards/{board_id}")

    def create_board(self, name: str) -> dict:
        return self._req(
            "POST",
            "/boards/",
            params={
                "name": name,
                "defaultLists": "false",
                "defaultLabels": "false",
                "prefs_permissionLevel": "private",
            },
        )

    def create_list(self, board_id: str, name: str, pos: int) -> dict:
        return self._req(
            "POST",
            "/lists",
            params={"name": name, "idBoard": board_id, "pos": pos * 100},
        )

    def create_label(self, board_id: str, name: str, color: str) -> dict:
        return self._req(
            "POST",
            "/labels",
            params={"name": name, "color": color, "idBoard": board_id},
        )

    def create_card(self, list_id: str, name: str, desc: str, label_ids: list[str]) -> dict:
        return self._req(
            "POST",
            "/cards",
            params={
                "idList": list_id,
                "name": name,
                "desc": desc,
                "idLabels": ",".join(label_ids),
            },
        )


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--md", default="docs/process/trello_seed_r1.md")
    p.add_argument("--board-name", default="Ex-Machina")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument(
        "--force-recreate",
        action="store_true",
        help="delete existing board with same name before creating (DANGEROUS)",
    )
    args = p.parse_args()

    if not os.path.exists(args.md):
        print(f"❌ md not found: {args.md}", file=sys.stderr)
        return 1

    cards = parse_md(args.md)
    print(f"📄 Parsed {len(cards)} cards from {args.md}")
    for c in cards:
        print(f"  [{c.release}] {c.number} {c.title[:60]}  → {c.target_list}")

    if args.dry_run:
        print("\n✅ dry-run done, no API calls made")
        return 0

    key = os.environ.get("TRELLO_API_KEY")
    token = os.environ.get("TRELLO_TOKEN")
    if not key or not token:
        print("❌ set TRELLO_API_KEY and TRELLO_TOKEN env vars", file=sys.stderr)
        print("   get them at https://trello.com/app-key", file=sys.stderr)
        return 1

    client = TrelloClient(key, token)

    existing = client.find_board(args.board_name)
    if existing:
        if args.force_recreate:
            print(f"⚠️  deleting existing board {existing['id']} …")
            client.delete_board(existing["id"])
        else:
            print(
                f"❌ board '{args.board_name}' already exists ({existing['url']}). "
                f"Use --force-recreate to wipe it.",
                file=sys.stderr,
            )
            return 1

    print(f"🎯 creating board '{args.board_name}' …")
    board = client.create_board(args.board_name)
    board_id = board["id"]
    board_url = board["url"]
    print(f"   board id={board_id}  url={board_url}")

    # lists
    list_ids: dict[str, str] = {}
    for i, name in enumerate(LISTS):
        lst = client.create_list(board_id, name, pos=i + 1)
        list_ids[name] = lst["id"]
        print(f"   + list {name}")

    # labels
    label_ids: dict[str, str] = {}
    for name, color in LABEL_COLORS.items():
        lab = client.create_label(board_id, name, color)
        label_ids[name] = lab["id"]
        print(f"   + label {name} ({color})")

    # cards
    print(f"\n🃏 creating {len(cards)} cards …")
    for c in cards:
        list_id = list_ids[c.target_list]
        lids = [label_ids[name] for name in c.display_labels if name in label_ids]
        card_name = f"{c.number} {c.title}"
        client.create_card(list_id, card_name, c.description(), lids)
        print(f"   + [{c.release}] {c.number} → {c.target_list}")

    print(f"\n✅ done. Board URL: {board_url}")
    print("   next: Monday planning — перенеси 3-5 карточек из Backlog в Sprint 1")
    return 0


if __name__ == "__main__":
    sys.exit(main())
