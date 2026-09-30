# Cold Outreach Pipeline — build-ready PRD

**Status:** v1 for Grok Build · **Owner:** DissolveO · **Working title:** Outreach Deck  
**Companion product:** Invite Buckets (warm circle) — this product is the **cold / new-market** track

## Product brief

**One-liner:** A private research workspace that finds local professionals (builders, contractors, realtors, designers, related businesses), studies the company *and* the people who run it, scores fit against your values and offers, and produces a briefing you can act on. Swipe Keep/Pass is only the review gate after the brief exists; tone + draft come last.

**Primary job:** “Examine who’s out there, research the business and its people, and tell me — in a clear briefing — whether they fit my values and what I’m building.”

**Secondary jobs:** Decide Keep/Pass on finished briefs; lock tone; leave a draft you send yourself.

**JTBD (full loop):** “Help me discover the right people around me, learn enough to approach them with care, decide who’s worth a first touch, lock the voice with me, and leave a ready draft in my hands.”

**Audience:** DissolveO (HeartMind Spaces / Dissolve Ontario / Heroic Guide work) and anyone on the team who does first-touch outreach. Primary vertical hypothesis: home/space professionals who care about how a place *feels* — painters’ partners, designers, builders, agents — plus adjacent local businesses.

**Relationship to Invite Buckets:** Invite Buckets is for people you already know. Outreach Deck is for people you don’t yet. Same draft-only ethic; different discovery and review UX.

## Non-negotiables

- **Draft-only send:** the app never transmits email, SMS, LinkedIn, or voice. It prepares drafts, scripts, and optional voice-script text. The human presses send in their own tools.
- **Human gate before any first touch:** every contact must pass an explicit approve (swipe right / Keep) before tone + draft stages unlock. No auto-send queues.
- **Source honesty:** every fact on a card must show where it came from (site, directory, LinkedIn public page, news, user note). Missing data stays blank or “unknown” — never invented emails, phones, revenue, or headcount.
- **Privacy & compliance:** store only publicly available or user-supplied data. No scraping behind logins. No purchased spam lists by default. Honor do-not-contact flags forever.
- **Warm Guide voice in UI:** prefer “prospects,” “deck,” “keep / pass,” “tone studio,” “draft.” Avoid “leads pipeline,” “conversion,” “spray and pray.”
- **Local-first / private by default:** data lives on the user’s machine or their Drive; no public directory of researched people.
- **Voice / video optional:** filmed personal video and voice-API scripts are *assets* attached to a draft stage, not required for v1 core loop.

## Pipeline stages (core loop)

```text
1 Discover  →  2 Research + Brief  →  3 Deck (swipe)  →  4 Tone  →  5 Draft  →  (You send)
         ▲________________________▲
         SPINE (most important)     review gate only
```

**Priority:** Research + briefing is the spine. Swipe is secondary — a fast way to clear finished briefs. Do not ship a pretty Deck with thin research.

| Stage | What the system does | What the human does |
|---|---|---|
| **1 · Discover** | Search by role, geo, niche; import CSV; suggest targets from directories/maps/web | Set ICP, geo radius, roles; approve search runs |
| **2 · Research** | Enrich name, company, email candidates, socials, about, values signals, public financial/size clues | Flag bad rows; add private notes |
| **3 · Deck** | Present one rich card at a time (swipe Keep / Pass / Later) | Decide fit; open deep detail before swiping |
| **4 · Tone** | Propose tone options from brand + card context; chat refine | Confirm voice, angle, offer hook |
| **5 · Draft** | Generate channel-ready draft (email / LinkedIn / text / voicemail script) | Edit, copy, send outside the app |

Optional later: **6 · Follow-up** reminders and reply logging (still draft-only).

## Ideal customer profile (ICP) — v1 defaults

Configurable, seeded for DissolveO’s world:

| Role segment | Why they matter | Example outreach angle |
|---|---|---|
| Interior / home designers | Spaces + feeling | Collaborations, referral painting, “how space feels” |
| Builders / GCs / contractors | New builds & renos | Finish partners, client-handoff painting |
| Real estate agents / brokerages | Staging & turnover | Soft-reset painting, open-house readiness |
| Architects / space planners | Spec & referrals | Spec partnerships |
| Adjacent local businesses | Cafés, wellness, galleries | Cross-promos, event hosting |

**Geo (default):** Grey Highlands incl. Collingwood; Simcoe County (Barrie, Innisfil, Orillia); Newmarket and those surrounding regions. **Exclude Muskoka** (may advertise later; not an active service / travel priority).  
**Offer hooks (configurable):** HeartMind Painting workshops & services; Dissolve Ontario gatherings; Heroic workshop invites; partnership / referral language — pick per campaign.

## Information architecture

Persistent nav:

| Tab | Purpose |
|---|---|
| **Campaigns** | ICP, geo, offer hook, status of a run |
| **Discover** | Search, imports, queue of raw finds |
| **Research** | Enrichment jobs + completeness scores |
| **Deck** | Swipe review of researched cards |
| **Tone & Draft** | Confirmed keeps → tone studio → drafts |
| **Library** | Scripts, brand voice, video/voice assets, do-not-contact |

Default route after onboarding: **Deck** if there are unreviewed cards; else **Campaigns**.

## Screen specs

### Global shell

```text
┌──────────────────────────────────────────────┐
│ Outreach Deck              Campaign ▾  [ · ] │
│ Discover → Research → Deck → Tone → Draft    │
│                                              │
│                 [active screen]              │
│                                              │
│ Campaigns  Discover  Research  Deck  Drafts  │
└──────────────────────────────────────────────┘
```

- Desktop max-width ~1200px; mobile single column with fixed bottom nav.
- Pipeline stepper always visible (current stage highlighted).
- Soft wellness visual language aligned with Invite Buckets (`#FDFCF8`, peach primary, sage, lavender, Outfit) so both products feel like one family.

### Campaigns

- Create campaign: name, role segments, geo, offer hook, channels allowed (email / LinkedIn / text / voice script).
- Status chips: Discovering · Researching · In deck · Tone · Drafting · Paused.
- One active campaign focus at a time for Deck.

### Discover

```text
┌ Discover ────────────────────────────────────┐
│ Filters: [Builders ▾] [Designers ▾] …        │
│ Geo: [Collingwood + 40km]  [Run search]      │
│                                              │
│ Results queue (unresearched)                 │
│ □ Apex Homes — Collingwood — builder         │
│ □ Mira Interiors — designer                  │
│ …                                            │
│ [Add selected to Research]  [Import CSV]     │
└──────────────────────────────────────────────┘
```

- Sources (v1, pluggable): Google Maps / Places-style public listings, company websites, LinkedIn public company/people pages (no login scrape), user CSV, manual add.
- Each raw row: org name, role guess, location, source URL, confidence.
- Deduplicate by domain + normalized name.

### Research

Worker (or agent-assisted batch) fills a **Prospect Profile** and a **Briefing document**. This stage is the product heart.

**Company + people research (required)**

- Company: what they do, clients/projects, public values, positioning, geo, size clues, recent news.
- People: founders / principals / decision-makers — roles, public bios, socials, anything that shows how they work and what they care about.
- Fit: explicit mapping to DissolveO / HeartMind / Dissolve values and current offers (why yes, why maybe, why no).
- Output: a readable briefing (1–2 pages) the human can trust before any Keep/Pass.

Worker (or agent-assisted batch) fills a **Prospect Profile**:

| Field | Required for Deck? | Notes |
|---|---|---|
| `displayName` / `orgName` | Yes | Person and/or company |
| `roles` | Yes | From ICP tags |
| `geo` | Yes | City / region |
| `emails[]` | Preferred | Candidate emails with confidence + source; never invent |
| `phones[]` | Optional | Same honesty rule |
| `website` | Preferred | |
| `socials` | Preferred | LinkedIn, IG, FB, X — URLs only |
| `about` | Preferred | Short public blurb |
| `valuesSignals[]` | Preferred | Quotes/themes from site (sustainability, family, luxury, local…) |
| `recentPublic[]` | Nice | News, posts, projects (dated + linked) |
| `sizeOrFinance` | Optional | Only if public (employee range, funding news). Label “public estimate / unknown” |
| `fitNotes` | Optional | Why this campaign might care |
| `documents[]` | Optional | Generated one-pagers / briefs attached for the reviewer |
| `completeness` | System | 0–100 for queue sorting |
| `sources[]` | Always | Provenance list |

**Documents the research stage can generate (for the human, not cold-sent as spam packs):**

- One-page **prospect brief** (who they are, fit angle, caution flags)
- Optional **partnership one-pager** tailored to segment (from brand library)
- Link list of source pages

Research never claims private financials. If only directory fluff exists, completeness stays low and Deck shows “thin profile.”

### Deck (swipe review) — hero UX

Detailed, not toy-gamified: full context on card; gestures are the decision, not the product.

```text
┌ Deck · 12 left ─────────────────────────────┐
│ ← Pass          Later          Keep →       │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Mira Interiors · Designer · Collingwood│  │
│  │ Completeness 78% · Sources: site, Maps │  │
│  │                                        │  │
│  │ About…                                 │  │
│  │ Values: local · calm spaces · …        │  │
│  │ Social: LI · IG · site                 │  │
│  │ Email candidates: a@… (med) · b@… (low)│  │
│  │ Public size: ~5–10 · unknown revenue   │  │
│  │ Fit: staging + “how space feels”       │  │
│  │ [Open brief PDF] [All sources]         │  │
│  └────────────────────────────────────────┘  │
│  Drag card or use buttons · keyboard ← →    │
└──────────────────────────────────────────────┘
```

**Gestures / actions**

| Action | Meaning | Next |
|---|---|---|
| **Keep** (swipe right) | Worth first touch | Moves to Tone queue |
| **Pass** (swipe left) | Not a fit / do not contact this campaign | Archived; optional global DNC |
| **Later** | Need more research or timing | Back to Research or Later pile |
| **Open detail** | Expand full profile + docs without deciding | Stay on card |

- Show social links as chips that open in browser; never auto-message.
- Show financial/size only with “public / unknown” labeling.
- Undo last swipe for 10 seconds.
- Keyboard: `←` Pass, `→` Keep, `↓` Later, `Space` expand.

### Tone studio (post-Keep)

Collaborative step with the user (or teammate role):

```text
┌ Tone ────────────────────────────────────────┐
│ Keeping: Mira Interiors                      │
│ Angle suggestions:                           │
│  ○ Warm local intro (preferred)              │
│  ○ Partner / referral                        │
│  ○ Soft workshop invite                      │
│                                              │
│ Voice: [HeartMind warm ▾]                    │
│ Channel: [Email ▾]                           │
│ Notes from you: [                      ]     │
│                                              │
│ Preview sample opening…                      │
│ [Lock tone → Draft]                          │
└──────────────────────────────────────────────┘
```

- Pulls brand voice presets (HeartMind / Dissolve / Heroic) + card `valuesSignals`.
- Chat-style refine optional: user says “less salesy, mention the local build,” system updates the locked tone brief.
- Locked tone brief is a short structured object: angle, must-say, must-not-say, channel, length.

### Draft stage

- Generates editable draft from locked tone + profile + offer hook.
- Channels: email, LinkedIn connection note, short text, voicemail/video script.
- **Copy** and **Open in mail client** (`mailto:` with body) — still no silent send.
- Optional attach: filmed video link or voice-API audio the user recorded earlier (cost/provider noted in settings; off by default).
- Status: Draft · Copied · Marked sent (manual) · Needs reply (manual).

## Data model (sketch)

```text
Campaign { id, name, segments[], geo, offerHookId, channels[], status }
Prospect {
  id, campaignIds[], displayName, orgName, roles[], geo,
  contacts: { emails[], phones[] }, website, socials[],
  about, valuesSignals[], recentPublic[], sizeOrFinance,
  fitNotes, documents[], sources[], completeness,
  deckStatus: unreviewed|kept|passed|later|dnc,
  toneBrief?, drafts[]
}
Draft { id, prospectId, channel, body, toneBrief, status, updatedAt }
BrandVoice { id, name, doSay[], dontSay[], sampleOpenings[] }
OfferHook { id, title, oneLiner, forSegments[] }
```

Persist: local JSON / IndexedDB for prototype; optional Google Drive sync later (same pattern as Invite Buckets seed).

## Agent / automation boundaries (Grok Build)

| Allowed automated | Requires human |
|---|---|
| Search & list candidates | Approving a Discover run’s spend/time |
| Public research + brief docs | Inventing contact info |
| Completeness scoring | Keep / Pass / Later |
| Tone suggestions + draft text | Locking tone; sending the message |
| Reminder that a draft is stale | Voice call / SMS blast |

**Voice API / video (phase 2 note):** settings panel lists providers and rough cost bands; generate *script* in v1; synthesize audio only when user opts in and supplies/approves a provider key. Prefer a short personal filmed clip for first touch when budget or trust is the concern.

## Design system (align with Invite Buckets)

- Background `#FDFCF8`, peach primary `#FFB7B2`, sage accents, soft lavender cards, Outfit (or system sans).
- Deck cards: large type, generous padding, source footnotes in muted text.
- Motion: card exit on swipe ~200ms; no confetti, no streak counters (detailed, not arcade).
- **Aesthetically pleasing is a v1 requirement**, not polish-later: calm Softly-inspired wellness UI (same family as Invite Buckets), generous type, soft cards, deliberate empty states — something you’d want open on a laptop.

## Acceptance criteria (v1)

1. User can create a campaign with ≥2 role segments and a geo.
2. Discover returns a deduped queue with source URLs; CSV import works.
3. Research produces profiles that never invent emails; unknown fields labeled.
4. Deck shows about, values, socials, contact candidates, public size/finance if any, and a brief doc link.
5. Keep / Pass / Later update status; Keep unlocks Tone.
6. Tone lock is required before Draft generate.
7. Draft is editable and copyable; no send API call exists in the app.
8. DNC flag removes a prospect from future Discover results.
9. UI language stays Guide-warm; no “leads/pipeline/conversion” chrome.
10. Works as a local SPA prototype with seed JSON (same spirit as Invite Buckets).

## Out of scope (v1)

- Auto-dialers, LinkedIn connection automation, purchased email databases
- CRM sync (HubSpot et al.) — maybe phase 3
- Multi-seat permissions beyond simple “reviewer” vs “drafter” labels
- Guaranteed email verification / deliverability infrastructure

## Phased delivery

| Phase | Ship |
|---|---|
| **P0** | PRD + IA + **aesthetic** empty shell + seed prospects + Deck swipe UI + manual Keep→Tone→Draft. *P0 = first clickable build: looks like the product, works for the review loop, no live discover APIs yet.* |
| **P1** | Discover filters + CSV + research completeness + brief PDF/markdown |
| **P2** | Agent-assisted research batches + brand voice library + mailto helpers |
| **P3** | Optional voice script + provider hook; filmed-video asset attach; Drive sync |

## Prior art (SpaceXAI / Grok Bot SDR pattern)

What you likely saw on the livestream is **not a separate public “swipe CRM” product** — it’s the SpaceXAI SDR workflow described in [Grok Bot for SDRs](https://x.ai/bot/guides/grok-bot-for-sdrs):

- Overnight **research packets + first-touch drafts** (often via Cursor + specialist bots)
- **Intake triage:** CLEAR (safe to stage unsent) vs FLAG (human must decide)
- **Finalize:** human **KEEP** and send from their own tools (Nooks / mail / LinkedIn). **Nothing auto-sends.**
- One job per bot (chief of staff, contact sheet, LinkedIn, CRM) rather than one mega-app

**Implication for Outreach Deck:** we are building the *same decision gates* (research → human Keep/Pass → tone → draft you send), adapted for a local services ICP without Salesforce/Nooks. Options:

1. **Bot-team path:** implement Discover/Research/Deck as Grok Bot routines + skills (closest to SpaceXAI); Deck can be a simple local review UI or even chat cards.
2. **App path:** keep the P0 SPA Deck (swipe Keep/Pass/Later) as the human review surface; bots feed it research JSON.
3. **Hybrid (recommended):** bots do discovery + research overnight; Deck UI is only the Keep/Pass gate + Tone/Draft — same ethic as CLEAR/FLAG/KEEP.

Do not invent contact data; do not auto-send; warm history and real signals beat cold templates.

## Open questions for DissolveO


1. ~~First geo lock-in~~ **Decided:** Grey Highlands + Collingwood; Simcoe (Barrie, Innisfil, Orillia); Newmarket + regions. **Out:** Muskoka.
2. Primary offer hook for cold first touch: painting partnership, workshop invite, or soft “coffee + see the work”?
3. Who else swipes (teammate role) in v1, or solo only?
4. Voice API interest: script-only for now, or budget a provider trial?
5. Should Pass on one campaign imply global DNC, or campaign-local by default?

## File / handoff

- This PRD: `/workspace/cold-outreach-app/COLD-OUTREACH-PRD.md`
- Seed data and prototype can mirror Invite Buckets layout under `/workspace/cold-outreach-app/` when build starts.
- Superdesign / visual sketches: optional follow-on after PRD sign-off.

---

*Draft-only. Research-honest. Human Keep before any words leave the building.*

## ICP living doc

See [`ICP-ONE-PAGER.md`](./ICP-ONE-PAGER.md) for the bot-ready Ideal Customer Profile (geo, dual tracks, Keep/Pass language, offers).

