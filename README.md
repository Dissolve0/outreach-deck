# Outreach Deck

Private research workspace for DissolveO’s **cold / new-market** outreach — companion to Invite Buckets (warm circle).

**Spine:** Research + briefing. Keep / Pass is only the review gate after a brief exists. Tone + draft come last. **Draft-only — the app never sends.**

Live seed briefs (2026-09-30) come from the Drive folder [Outreach Deck](https://drive.google.com/drive/folders/1yc3vk6uTDDGbbDG_E7g2-azCbktGo_6y). Contacts appear only when they were published on a source page.

## Run locally

```bash
cd outreach-deck
python3 -m http.server 8766
```

Open http://localhost:8766/

Do not open `index.html` as a `file://` URL — the browser blocks JSON `fetch()` from disk.

## Publish later

This folder is a static site (HTML / CSS / JS). Options:

- GitHub Pages from the repo root
- Netlify / Cloudflare Pages drop of this folder
- Any static host

No backend is required. Decisions live in `localStorage` (`outreach-deck-v1`).

## Screens

| Screen | What it does |
|---|---|
| **Discover** | Add a thin candidate by hand, import JSON, export decisions |
| **Briefs** | Library with completeness, HeartMind / Dissolve tags, known-deepen badge |
| **Brief detail** | Company, people, values, sources, suggested offer, Keep / Pass / Later |
| **Deck** | One rich card at a time; keyboard ← Pass · → Keep · ↓ Later |
| **Decisions** | Log of Keep / Pass / Later |
| **Tone** | Lock angle + voice after Keep |
| **Draft** | Copy-ready note. You send it outside the app. |

## Rules

- Never invent emails or phones
- Resonance / Paz is a **known deepen**, not cold outreach
- Geo in: Grey Highlands (Collingwood), Simcoe (Barrie, Innisfil, Orillia), Newmarket
- Geo out: Muskoka
