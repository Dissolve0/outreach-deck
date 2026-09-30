# Goal: Evolve Outreach Deck P0 → Drive-backed research UI

## Objective
Take the existing P0 SPA in this folder and evolve it so DissolveO can review **real** briefs from Drive (or exported JSON), Keep/Pass/Later with persistence, and a tone stub — without ever sending outreach.

## Done when
1. `python3 -m http.server 8766` shows Briefs → detail → Keep/Pass/Later → Decisions
2. Design matches AGENTS.md tokens; Research spine emphasized
3. Can load briefs from `data/briefs.json` (and optionally a simple import of Drive-exported markdown)
4. README documents run + Drive folder links
5. No send APIs; SAMPLE vs live briefs clearly labeled

## Out of scope
Auto-email, LinkedIn automation, inventing contacts, Muskoka geo.

## Kickoff
Read AGENTS.md + COLD-OUTREACH-PRD.md + ICP-ONE-PAGER.md, then improve the SPA.
