(() => {
  const STORAGE_KEY = "outreach-deck-v1";
  const STAGE_BY_VIEW = {
    discover: "discover",
    library: "research",
    detail: "research",
    deck: "deck",
    decisions: "deck",
    tone: "tone",
    draft: "draft",
  };

  const state = {
    candidates: [],
    briefs: {},
    meta: null,
    decisions: [],
    statuses: {},
    tones: {},
    extraCandidates: [],
    view: "library",
    filter: "all",
    detailId: null,
    deckIndex: 0,
    toneId: null,
    query: "",
    undo: null,
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      state.statuses = data.statuses || {};
      state.decisions = data.decisions || [];
      state.tones = data.tones || {};
      state.extraCandidates = data.extraCandidates || [];
    } catch (_) {
      /* ignore corrupt store */
    }
  }

  function saveStore() {
    const payload = {
      statuses: state.statuses,
      decisions: state.decisions,
      tones: state.tones,
      extraCandidates: (state.candidates || []).filter((c) => String(c.id).startsWith("c-manual-")),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function trackLabel(t) {
    return t === "heartmind" ? "HeartMind" : t === "dissolve" ? "Dissolve" : t;
  }

  function statusOf(c) {
    return state.statuses[c.id] || c.deckStatus || "unreviewed";
  }

  function briefFor(c) {
    return c.briefId ? state.briefs[c.briefId] : null;
  }

  function withBriefs() {
    return state.candidates.filter((c) => c.hasBrief && briefFor(c));
  }

  function unreviewedBriefs() {
    return withBriefs().filter((c) => statusOf(c) === "unreviewed");
  }

  function keptCandidates() {
    return state.candidates.filter((c) => statusOf(c) === "kept");
  }

  function setPipeline(view) {
    const stage = STAGE_BY_VIEW[view] || "research";
    const order = ["discover", "research", "deck", "tone", "draft"];
    const idx = order.indexOf(stage);
    $$("#pipeline li").forEach((li) => {
      const s = li.dataset.stage;
      li.classList.toggle("active", s === stage && !li.classList.contains("spine"));
      li.classList.toggle("done", order.indexOf(s) < idx);
      if (li.classList.contains("spine")) {
        li.classList.toggle("active", stage === "research");
      }
    });
  }

  function setNav(view) {
    $$(".nav-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view || (view === "detail" && btn.dataset.view === "library"));
    });
    $("#lib-count").textContent = String(state.candidates.length);
    $("#deck-count").textContent = String(unreviewedBriefs().length);
    $("#dec-count").textContent = String(state.decisions.length);
    $("#tone-count").textContent = String(keptCandidates().length);
    const draftEl = $("#draft-count");
    if (draftEl) draftEl.textContent = String(keptCandidates().filter((c) => state.tones[c.id]).length);
  }

  function formatWhen(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-CA", {
        timeZone: "America/Toronto",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }) + " ET";
    } catch (_) {
      return iso;
    }
  }

  /* ——— Views ——— */

  function renderDiscover() {
    const html = `
      <div class="page-head">
        <div>
          <span class="eyebrow">Stage 1</span>
          <h1>Discover</h1>
          <p>Add a name you found in the wild. Research still has to happen before Keep / Pass. Import a JSON export if you already have rows.</p>
        </div>
      </div>
      <div class="detail-layout">
        <div class="card section-card">
          <h3>Add a candidate</h3>
          <form id="add-form" class="add-form">
            <label>Organization<input required name="orgName" placeholder="Studio or company"></label>
            <label>Role<input name="roles" placeholder="Interior designer"></label>
            <label>Geo<input name="geo" placeholder="Collingwood, ON"></label>
            <label>Website<input name="website" placeholder="https://"></label>
            <label>About<textarea name="about" rows="3" placeholder="Public one-liner only. Leave blank if unknown."></textarea></label>
            <label>Track
              <select name="track">
                <option value="heartmind">HeartMind</option>
                <option value="dissolve">Dissolve</option>
                <option value="both">Both</option>
              </select>
            </label>
            <button class="button primary" type="submit">Add to library</button>
          </form>
          <p class="tone-stub-note">Thin on purpose. A brief is still required before the Deck.</p>
        </div>
        <div class="card section-card">
          <h3>Import / export</h3>
          <p>Load a <code>candidates.json</code> or combined <code>{candidates, briefs}</code> file. Decisions stay in this browser.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0">
            <label class="button secondary">Import JSON<input id="import-json" type="file" accept="application/json,.json" hidden></label>
            <button type="button" class="button outline" id="export-decisions">Export decisions</button>
            <button type="button" class="button ghost" id="reset-local">Clear local decisions</button>
          </div>
          <p class="unknown">Drive folder for live research: Outreach Deck on Google Drive. Browser cannot write Drive without OAuth — export and drop files there yourself.</p>
        </div>
      </div>
    `;
    $("#app").innerHTML = html;
    $("#add-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const track = fd.get("track");
      const tracks = track === "both" ? ["heartmind", "dissolve"] : [track];
      const id = "c-manual-" + Date.now();
      state.candidates.push({
        id,
        sample: false,
        orgName: String(fd.get("orgName") || "").trim(),
        displayName: String(fd.get("orgName") || "").trim(),
        roles: String(fd.get("roles") || "Unknown").split(",").map((s) => s.trim()).filter(Boolean),
        geo: String(fd.get("geo") || "Unknown"),
        tracks,
        website: String(fd.get("website") || ""),
        completeness: 18,
        hasBrief: false,
        briefId: null,
        deckStatus: "unreviewed",
        about: String(fd.get("about") || "Thin profile — research still needed."),
        valuesSignals: [],
        sizeOrFinance: "Unknown",
      });
      saveStore();
      toast("Added to library · still needs a brief");
      state.view = "library";
      state.filter = "thin";
      render();
    });
    $("#import-json").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const incoming = data.candidates || data;
        const list = Array.isArray(incoming) ? incoming : [];
        if (!list.length) throw new Error("no candidates");
        const existing = new Set(state.candidates.map((c) => c.id));
        let added = 0;
        list.forEach((c) => {
          if (!c.id || existing.has(c.id)) return;
          state.candidates.push(c);
          existing.add(c.id);
          added += 1;
        });
        (data.briefs || []).forEach((b) => {
          if (b?.id) state.briefs[b.id] = b;
        });
        saveStore();
        toast(`Imported ${added} new candidates`);
        render();
      } catch (err) {
        toast("Could not import that JSON");
        console.error(err);
      }
    });
    $("#export-decisions").addEventListener("click", exportDecisions);
    $("#reset-local").addEventListener("click", () => {
      if (!confirm("Clear Keep / Pass / Later and locked tones in this browser?")) return;
      state.statuses = {};
      state.decisions = [];
      state.tones = {};
      saveStore();
      toast("Local decisions cleared");
      render();
    });
  }

  function exportDecisions() {
    const payload = {
      exportedAt: new Date().toISOString(),
      decisions: state.decisions,
      statuses: state.statuses,
      tones: state.tones,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "outreach-deck-decisions.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Decisions exported · you still send outside the app");
  }

  function renderLibrary() {
    const filter = state.filter;
    let list = [...state.candidates];
    if (filter === "ready") list = list.filter((c) => c.hasBrief);
    else if (filter === "thin") list = list.filter((c) => !c.hasBrief);
    else if (filter === "heartmind") list = list.filter((c) => c.tracks.includes("heartmind"));
    else if (filter === "dissolve") list = list.filter((c) => c.tracks.includes("dissolve"));
    else if (filter === "unreviewed") list = list.filter((c) => statusOf(c) === "unreviewed" && c.hasBrief);
    else if (filter === "kept") list = list.filter((c) => statusOf(c) === "kept");
    else if (filter === "deepen") list = list.filter((c) => c.knownDeepen);

    const q = (state.query || "").trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const blob = [c.orgName, c.geo, c.about, ...(c.roles || []), ...(c.tracks || [])].join(" ").toLowerCase();
        return blob.includes(q);
      });
    }

    list.sort((a, b) => {
      if (a.hasBrief !== b.hasBrief) return a.hasBrief ? -1 : 1;
      return (b.completeness || 0) - (a.completeness || 0);
    });

    const ready = withBriefs().length;
    const html = `
      <div class="page-head">
        <div>
          <span class="eyebrow">Research spine</span>
          <h1>Brief library</h1>
          <p>Read the briefing before you Keep or Pass. Completeness and track tags help you prioritize — thin profiles stay out of the Deck until researched.</p>
        </div>
        <div class="head-note"><strong>${ready}</strong> ready briefs · ${state.candidates.length} candidates</div>
      </div>
      <div class="toolbar">
        <div class="filter-pills" role="tablist" aria-label="Filter briefs">
          ${[
            ["all", "All"],
            ["ready", "Ready"],
            ["unreviewed", "Unreviewed"],
            ["heartmind", "HeartMind"],
            ["dissolve", "Dissolve"],
            ["thin", "Thin"],
            ["kept", "Kept"],
            ["deepen", "Deepen"],
          ]
            .map(
              ([id, label]) =>
                `<button type="button" class="filter-pill${filter === id ? " active" : ""}" data-filter="${id}">${label}</button>`
            )
            .join("")}
        </div>
        <input class="search-input" id="lib-search" type="search" placeholder="Search name, geo, role…" value="${escapeAttr(state.query || "")}">
      </div>
      <div class="brief-grid">
        ${list.map(cardHtml).join("") || `<div class="empty-state card" style="padding:40px;grid-column:1/-1">Nothing in this filter.</div>`}
      </div>
      <div class="drive-note">
        <strong>Drive structure (documented for later OAuth sync)</strong><br>
        Planned folders: <code>ICP/</code> · <code>00-candidates/</code> · <code>briefs/</code> · <code>decisions/</code>.
        P0 uses local JSON seed + <code>localStorage</code> (<code>${STORAGE_KEY}</code>) because the browser cannot write Drive without OAuth.
        ${state.meta ? `<br>Campaign: ${escapeHtml(state.meta.campaign)} · Geo in: ${escapeHtml(state.meta.geo)} · Out: ${escapeHtml(state.meta.geoOut)}` : ""}
      </div>
    `;
    $("#app").innerHTML = html;
    const search = $("#lib-search");
    if (search) {
      search.addEventListener("input", (e) => {
        state.query = e.target.value;
      });
      search.addEventListener("keydown", (e) => {
        if (e.key === "Enter") render();
      });
      search.addEventListener("blur", () => render());
    }
    $$(".filter-pill").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.filter = btn.dataset.filter;
        render();
      })
    );
    $$(".brief-card").forEach((btn) =>
      btn.addEventListener("click", () => openDetail(btn.dataset.id))
    );
  }

  function cardHtml(c) {
    const st = statusOf(c);
    const low = (c.completeness || 0) < 60;
    return `
      <button type="button" class="brief-card ${c.hasBrief ? "has-brief" : "thin"}" data-id="${c.id}">
        <div class="brief-card-top">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${c.sample ? `<span class="sample-badge">Sample</span>` : ""}
            ${c.knownDeepen ? `<span class="sample-badge" style="background:#efe8d6;color:#6b5420">Known deepen</span>` : ""}
            <span class="status-chip ${st}">${st}</span>
          </div>
          ${c.hasBrief ? `<span class="meta-tag">Brief ready</span>` : `<span class="thin-note">Thin profile</span>`}
        </div>
        <div>
          <h2>${escapeHtml(c.orgName)}</h2>
          <div class="brief-meta">
            ${(c.roles || []).map((r) => `<span class="meta-tag">${escapeHtml(r)}</span>`).join("")}
            <span class="meta-tag">${escapeHtml(c.geo)}</span>
            ${(c.tracks || [])
              .map((t) => `<span class="track-tag ${t}">${trackLabel(t)}</span>`)
              .join("")}
          </div>
        </div>
        <p class="brief-about">${escapeHtml(c.about || "")}</p>
        <div class="completeness">
          <div class="completeness-bar" aria-hidden="true">
            <div class="completeness-fill${low ? " low" : ""}" style="width:${c.completeness || 0}%"></div>
          </div>
          <span>${c.completeness || 0}%</span>
        </div>
      </button>
    `;
  }

  function openDetail(id) {
    state.detailId = id;
    state.view = "detail";
    render();
  }

  function renderDetail() {
    const c = state.candidates.find((x) => x.id === state.detailId);
    if (!c) {
      state.view = "library";
      return renderLibrary();
    }
    const b = briefFor(c);
    const st = statusOf(c);

    if (!b) {
      $("#app").innerHTML = `
        <div class="detail-back">
          <button type="button" class="button ghost" id="back-lib">← Back to briefs</button>
        </div>
        <div class="card section-card">
          <h3>Thin profile</h3>
          <p><strong>${escapeHtml(c.orgName)}</strong> does not have a research brief yet. Completeness ${c.completeness}%.</p>
          <p class="unknown">${escapeHtml(c.about || "No public about yet.")}</p>
          <p style="margin-top:14px;font-size:12px;color:var(--muted)">Keep / Pass unlocks only after a brief exists — Research is the spine.</p>
        </div>
      `;
      $("#back-lib").addEventListener("click", () => {
        state.view = "library";
        render();
      });
      return;
    }

    $("#app").innerHTML = `
      <div class="detail-back">
        <button type="button" class="button ghost" id="back-lib">← Back to briefs</button>
      </div>
      <div class="detail-layout">
        <div>
          <div class="card detail-hero">
            <div class="detail-hero-top">
              <div>
                ${c.sample ? `<span class="sample-badge">Sample · fictional demo</span>` : ""}
                <h1>${escapeHtml(b.company.name)}</h1>
                <p class="detail-sub">${escapeHtml((c.roles || []).join(" · "))} · ${escapeHtml(c.geo)} · Updated ${escapeHtml(b.updatedAt)}</p>
                <div class="brief-meta" style="margin-top:10px">
                  ${(c.tracks || [])
                    .map((t) => `<span class="track-tag ${t}">${trackLabel(t)}</span>`)
                    .join("")}
                  <span class="status-chip ${st}">${st}</span>
                  <span class="meta-tag">Completeness ${c.completeness}%</span>
                </div>
              </div>
            </div>
            <p style="margin:0;font-size:14px;line-height:1.55;color:var(--text)">${escapeHtml(b.company.whatTheyDo)}</p>
            <div class="detail-actions" id="detail-actions">
              <button type="button" class="button keep" data-act="kept">→ Keep</button>
              <button type="button" class="button later" data-act="later">Later</button>
              <button type="button" class="button pass" data-act="passed">← Pass</button>
              ${st === "kept" ? `<button type="button" class="button primary" id="goto-tone">Open Tone studio</button>` : ""}
            </div>
          </div>

          <div class="card section-card">
            <h3>Company</h3>
            <p><strong>Positioning.</strong> ${escapeHtml(b.company.positioning)}</p>
            <p><strong>Clients / projects.</strong> ${escapeHtml(b.company.clientsProjects)}</p>
            <p><strong>Size (public).</strong> ${escapeHtml(b.company.sizeClues)}</p>
          </div>

          <div class="card section-card">
            <h3>People</h3>
            ${b.people
              .map(
                (p) => `
              <div class="person-block">
                <strong>${escapeHtml(p.name)}</strong>
                <div class="role">${escapeHtml(p.role)}</div>
                <p>${escapeHtml(p.bio)}</p>
                ${
                  p.socials && p.socials.length
                    ? `<div class="chip-row" style="margin-top:8px">${p.socials
                        .map(
                          (s) =>
                            `<a class="social-chip" href="${escapeAttr(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`
                        )
                        .join("")}</div>`
                    : ""
                }
              </div>`
              )
              .join("")}
          </div>

          <div class="card section-card">
            <h3>Values signals</h3>
            <ul>${b.values.signals.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
            <div style="margin-top:14px">
              ${(b.values.quotes || [])
                .map(
                  (q) => `
                <blockquote class="quote-block">
                  “${escapeHtml(q.text)}”
                  <cite>— ${escapeHtml(q.source)}</cite>
                </blockquote>`
                )
                .join("")}
            </div>
          </div>

          <div class="card section-card">
            <h3>Fit</h3>
            <div class="fit-grid">
              ${fitBox("HeartMind Spaces", b.fit.heartmind)}
              ${fitBox("Dissolve", b.fit.dissolve)}
            </div>
            ${
              b.fit.partnerSignals?.length
                ? `<p style="margin-top:12px;font-size:12px;color:var(--muted)"><strong style="color:var(--text)">Partner signals:</strong> ${escapeHtml(b.fit.partnerSignals.join(" · "))}</p>`
                : ""
            }
          </div>
        </div>

        <div class="side-stack">
          <div class="card section-card">
            <h3>Suggested offer</h3>
            <div class="offer-box">
              <div class="track-line">${trackLabel(b.suggestedOffer.track)} track</div>
              <h4>${escapeHtml(b.suggestedOffer.title)}</h4>
              <p>${escapeHtml(b.suggestedOffer.angle)}</p>
            </div>
            <p style="margin-top:12px;font-size:11px;color:var(--faint)">Draft-only. Tone unlocks after Keep. You send outside the app.</p>
          </div>

          <div class="card section-card">
            <h3>Contacts</h3>
            ${
              b.contacts.emails?.length
                ? `<ul>${b.contacts.emails
                    .map(
                      (e) =>
                        `<li>${escapeHtml(e.address)} <span class="meta-tag">${escapeHtml(e.confidence)} · ${escapeHtml(e.source)}</span></li>`
                    )
                    .join("")}</ul>`
                : `<p class="unknown">Email unknown — never invent.</p>`
            }
            ${
              b.contacts.phones?.length
                ? `<ul>${b.contacts.phones.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`
                : `<p class="unknown">Phone unknown.</p>`
            }
            <p style="margin-top:8px;font-size:11px;color:var(--faint)">${escapeHtml(b.contacts.note || "")}</p>
          </div>

          <div class="card section-card">
            <h3>Socials & links</h3>
            <div class="chip-row">
              ${(b.socials || [])
                .map(
                  (s) =>
                    `<a class="social-chip" href="${escapeAttr(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`
                )
                .join("")}
            </div>
          </div>

          <div class="card section-card">
            <h3>Sources</h3>
            <ul class="source-list">
              ${b.sources
                .map(
                  (s) => `
                <li>
                  <span class="source-type">${escapeHtml(s.type)}</span>
                  ${
                    s.url
                      ? `<a href="${escapeAttr(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`
                      : `<span>${escapeHtml(s.label)}${s.detail ? " — " + escapeHtml(s.detail) : ""}</span>`
                  }
                </li>`
                )
                .join("")}
            </ul>
          </div>

          ${
            b.fit.cautionFlags?.length
              ? `<div class="caution"><strong>Caution</strong>${b.fit.cautionFlags.map((f) => escapeHtml(f)).join(" · ")}</div>`
              : ""
          }
        </div>
      </div>
    `;

    $("#back-lib").addEventListener("click", () => {
      state.view = "library";
      render();
    });
    $$("#detail-actions [data-act]").forEach((btn) =>
      btn.addEventListener("click", () => decide(c.id, btn.dataset.act, "detail"))
    );
    const toneBtn = $("#goto-tone");
    if (toneBtn) {
      toneBtn.addEventListener("click", () => {
        state.toneId = c.id;
        state.view = "tone";
        render();
      });
    }
  }

  function fitBox(label, fit) {
    const score = (fit?.score || "unknown").toLowerCase();
    return `
      <div class="fit-box ${score}">
        <div class="label">${escapeHtml(label)}</div>
        <div class="score">${escapeHtml(score)}</div>
        <p>${escapeHtml(fit?.why || "")}</p>
      </div>
    `;
  }

  function renderDeck() {
    const queue = unreviewedBriefs();
    if (state.deckIndex >= queue.length) state.deckIndex = 0;
    const c = queue[state.deckIndex];

    if (!c) {
      $("#app").innerHTML = `
        <div class="page-head">
          <div>
            <span class="eyebrow">Review gate</span>
            <h1>Deck</h1>
            <p>Swipe is secondary — only finished briefs land here.</p>
          </div>
        </div>
        <div class="card deck-empty">
          <h2>All caught up</h2>
          <p>No unreviewed briefs right now. Open the library to read research, or check Decisions for what you already Kept / Passed.</p>
          <div style="margin-top:18px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
            <button type="button" class="button secondary" id="to-lib">Brief library</button>
            <button type="button" class="button outline" id="to-dec">Decisions log</button>
          </div>
        </div>
      `;
      $("#to-lib")?.addEventListener("click", () => {
        state.view = "library";
        render();
      });
      $("#to-dec")?.addEventListener("click", () => {
        state.view = "decisions";
        render();
      });
      return;
    }

    const b = briefFor(c);
    $("#app").innerHTML = `
      <div class="page-head">
        <div>
          <span class="eyebrow">Review gate</span>
          <h1>Deck</h1>
          <p>One rich card at a time. Open the full brief anytime — gestures decide, research informs.</p>
        </div>
        <div class="head-note"><strong>${queue.length}</strong> left</div>
      </div>
      <div class="deck-stage">
        <div class="deck-counter">${state.deckIndex + 1} of ${queue.length} · keyboard ← Pass · → Keep · ↓ Later</div>
        <div class="card deck-card" id="deck-card">
          <div class="brief-card-top">
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${c.sample ? `<span class="sample-badge">Sample</span>` : ""}
              ${(c.tracks || [])
                .map((t) => `<span class="track-tag ${t}">${trackLabel(t)}</span>`)
                .join("")}
            </div>
            <span class="meta-tag">${c.completeness}%</span>
          </div>
          <h2 style="margin:14px 0 4px;font-size:26px;letter-spacing:-.04em">${escapeHtml(c.orgName)}</h2>
          <p class="detail-sub">${escapeHtml((c.roles || []).join(" · "))} · ${escapeHtml(c.geo)}</p>
          <p style="margin:16px 0 0;font-size:14px;line-height:1.55">${escapeHtml(b.company.whatTheyDo)}</p>
          <div style="margin-top:16px">
            <div class="eyebrow" style="margin-bottom:8px">Values</div>
            <div class="chip-row">
              ${b.values.signals
                .slice(0, 4)
                .map((s) => `<span class="meta-tag">${escapeHtml(s)}</span>`)
                .join("")}
            </div>
          </div>
          <div class="offer-box" style="margin-top:18px">
            <div class="track-line">Suggested · ${trackLabel(b.suggestedOffer.track)}</div>
            <h4>${escapeHtml(b.suggestedOffer.title)}</h4>
            <p>${escapeHtml(b.suggestedOffer.angle)}</p>
          </div>
          <div style="margin-top:auto;padding-top:18px">
            <button type="button" class="button ghost" id="open-full">Open full brief</button>
          </div>
        </div>
        <div class="deck-gestures">
          <button type="button" class="button pass" data-act="passed">← Pass</button>
          <button type="button" class="button later" data-act="later">Later</button>
          <button type="button" class="button keep" data-act="kept">Keep →</button>
        </div>
        <p class="deck-hint">Detailed, not arcade — no streaks, no confetti. Undo available for a few seconds.</p>
        <div class="undo-bar" id="undo-bar" hidden>
          <button type="button" class="button outline" id="undo-btn">Undo last decision</button>
        </div>
      </div>
    `;

    $("#open-full").addEventListener("click", () => openDetail(c.id));
    $$(".deck-gestures [data-act]").forEach((btn) =>
      btn.addEventListener("click", () => animateDecide(c.id, btn.dataset.act))
    );
    if (state.undo) {
      $("#undo-bar").hidden = false;
      $("#undo-btn").addEventListener("click", undoLast);
    }
  }

  function animateDecide(id, action) {
    const card = $("#deck-card");
    if (!card) return decide(id, action, "deck");
    const cls = action === "kept" ? "exit-keep" : action === "passed" ? "exit-pass" : "exit-later";
    card.classList.add(cls);
    setTimeout(() => decide(id, action, "deck"), 200);
  }

  function decide(id, action, from) {
    const c = state.candidates.find((x) => x.id === id);
    if (!c) return;
    if (!c.hasBrief) {
      toast("Brief required before Keep / Pass");
      return;
    }
    if (c.knownDeepen && action === "kept") {
      const ok = confirm("This is a known deepen, not a cold first touch. Keep means deepen the existing relationship — not a pitch. Continue?");
      if (!ok) return;
    }

    const prev = statusOf(c);
    state.undo = {
      id,
      prevStatus: prev === action ? "unreviewed" : prev,
      prevDecisions: state.decisions.slice(),
      expires: Date.now() + 10000,
    };

    state.statuses[id] = action;
    state.decisions.unshift({
      id: `d-${Date.now()}`,
      candidateId: id,
      orgName: c.orgName,
      action,
      tracks: c.tracks || [],
      at: new Date().toISOString(),
      from,
    });
    // keep log reasonable
    if (state.decisions.length > 100) state.decisions.length = 100;
    saveStore();

    const labels = { kept: "Kept", passed: "Passed", later: "Later" };
    toast(`${labels[action] || action} · ${c.orgName}`);

    if (action === "kept" && from === "detail") {
      state.toneId = id;
      state.view = "tone";
    } else if (from === "deck") {
      // stay on deck; index stays (item removed from unreviewed)
      state.view = "deck";
    } else {
      state.view = "detail";
    }
    render();

    clearTimeout(decide._undoT);
    decide._undoT = setTimeout(() => {
      if (state.undo && Date.now() >= state.undo.expires) {
        state.undo = null;
        if (state.view === "deck") render();
      }
    }, 10000);
  }

  function undoLast() {
    if (!state.undo || Date.now() > state.undo.expires) {
      state.undo = null;
      toast("Undo window closed");
      render();
      return;
    }
    const { id, prevStatus, prevDecisions } = state.undo;
    if (prevStatus === "unreviewed") delete state.statuses[id];
    else state.statuses[id] = prevStatus;
    state.decisions = prevDecisions;
    state.undo = null;
    saveStore();
    toast("Undone");
    render();
  }

  function renderDecisions() {
    const rows = state.decisions;
    $("#app").innerHTML = `
      <div class="page-head">
        <div>
          <span class="eyebrow">Log</span>
          <h1>Decisions</h1>
          <p>Keep / Pass / Later history stored on this device. Pass is campaign-local for P0 — not global DNC yet.</p>
        </div>
        <div class="head-note"><strong>${rows.length}</strong> entries</div>
      </div>
      ${
        rows.length
          ? `<div class="decisions-list">${rows
              .map((d) => {
                const label = d.action === "kept" ? "kept" : d.action === "passed" ? "passed" : "later";
                return `
                <article class="card decision-row">
                  <span class="status-chip ${label}">${label}</span>
                  <div>
                    <h3>${escapeHtml(d.orgName)}</h3>
                    <p>${(d.tracks || []).map(trackLabel).join(" · ")} · from ${escapeHtml(d.from || "deck")}</p>
                  </div>
                  <div class="decision-time">${formatWhen(d.at)}</div>
                </article>`;
              })
              .join("")}</div>`
          : `<div class="card empty-state">No decisions yet. Open a brief or the Deck when research is ready.</div>`
      }
    `;
  }

  function renderTone() {
    const kept = keptCandidates();
    if (!state.toneId && kept.length) state.toneId = kept[0].id;
    const c = kept.find((x) => x.id === state.toneId) || null;
    const b = c ? briefFor(c) : null;
    const locked = c ? state.tones[c.id] : null;

    $("#app").innerHTML = `
      <div class="page-head">
        <div>
          <span class="eyebrow">Post-Keep · stub</span>
          <h1>Tone studio</h1>
          <p>Lock a voice and angle before any draft. P0 is a light placeholder — full chat refine comes later. Still draft-only; nothing sends.</p>
        </div>
      </div>
      ${
        !kept.length
          ? `<div class="card empty-state">Keep someone from a brief first — Tone unlocks after Keep.</div>`
          : `<div class="tone-layout">
              <div class="tone-list">
                ${kept
                  .map(
                    (k) => `
                  <button type="button" class="tone-pick${k.id === state.toneId ? " active" : ""}" data-id="${k.id}">
                    ${escapeHtml(k.orgName)}
                    <small>${(k.tracks || []).map(trackLabel).join(" · ")}</small>
                  </button>`
                  )
                  .join("")}
              </div>
              <div class="card tone-panel">
                ${
                  c && b
                    ? `
                  <h2>${escapeHtml(c.orgName)}</h2>
                  <p>Suggested offer: ${escapeHtml(b.suggestedOffer.title)}. Pick an angle, then lock tone.</p>
                  <div class="angle-options">
                    ${[
                      ["warm", "Warm local intro", "Preferred — neighboring craft, coffee to see the work."],
                      ["partner", "Partner / referral", "Finish handoff or co-host language, mutual upside."],
                      ["workshop", "Soft workshop invite", "Single small gathering — Dissolve or HeartMind as fits."],
                    ]
                      .map(
                        ([id, title, desc]) => `
                      <label class="angle-option">
                        <input type="radio" name="angle" value="${id}" ${
                          (locked?.angle || "warm") === id ? "checked" : ""
                        }>
                        <div><strong>${title}</strong><span>${desc}</span></div>
                      </label>`
                      )
                      .join("")}
                  </div>
                  <div class="field" style="margin-bottom:14px">
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">Voice preset</label>
                    <select class="select-control" id="voice-select" style="height:42px;width:100%;border:1px solid var(--line);border-radius:12px;padding:0 14px;background:var(--surface)">
                      <option value="heartmind" ${
                        (locked?.voice || (b.suggestedOffer.track === "heartmind" ? "heartmind" : "dissolve")) ===
                        "heartmind"
                          ? "selected"
                          : ""
                      }>HeartMind warm</option>
                      <option value="dissolve" ${
                        (locked?.voice || b.suggestedOffer.track) === "dissolve" ? "selected" : ""
                      }>Dissolve relational</option>
                      <option value="heroic">Heroic workshop</option>
                    </select>
                  </div>
                  <div class="tone-preview" id="tone-preview">${escapeHtml(previewOpening(b, locked))}</div>
                  <button type="button" class="button primary" id="lock-tone">${
                    locked ? "Update locked tone" : "Lock tone → Draft"
                  }</button>
                  ${
                    locked
                      ? `<p class="tone-stub-note">Locked ${formatWhen(locked.at)} · angle ${escapeHtml(
                          locked.angle
                        )} · voice ${escapeHtml(locked.voice)}. Open Draft to copy a ready note — nothing is sent.</p>`
                      : `<p class="tone-stub-note">Locking stores your choice in this browser. No email is sent.</p>`
                  }
                `
                    : `<p class="unknown">Select a Kept prospect.</p>`
                }
              </div>
            </div>`
      }
    `;

    $$(".tone-pick").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.toneId = btn.dataset.id;
        render();
      })
    );
    const lock = $("#lock-tone");
    if (lock && c) {
      const refreshPreview = () => {
        const angle = $('input[name="angle"]:checked')?.value || "warm";
        const voice = $("#voice-select")?.value || "heartmind";
        $("#tone-preview").textContent = previewOpening(b, { angle, voice });
      };
      $$('input[name="angle"]').forEach((el) => el.addEventListener("change", refreshPreview));
      $("#voice-select")?.addEventListener("change", refreshPreview);
      lock.addEventListener("click", () => {
        const angle = $('input[name="angle"]:checked')?.value || "warm";
        const voice = $("#voice-select")?.value || "heartmind";
        state.tones[c.id] = { angle, voice, at: new Date().toISOString() };
        saveStore();
        toast("Tone locked · draft stays with you");
        state.view = "draft";
        render();
      });
    }
  }

  function firstName(b) {
    const person = b.people?.[0]?.name || "";
    return person.split(" ")[0] || "";
  }

  function previewOpening(b, locked) {
    const angle = locked?.angle || "warm";
    const name = b.company.name;
    const who = firstName(b);
    const hello = who ? `Hi ${who}` : "Hi";
    const geo = (b.company.geo || "").split("(")[0].trim();
    const signal = (b.values.signals?.[0] || "the care in the work").replace(/\.$/, "");
    const quote = b.values.quotes?.[0]?.text;
    const offer = b.suggestedOffer || {};
    const deepen = (b.fit?.cautionFlags || []).some((f) => /not cold|known deepen|hard pass on a cold/i.test(f));

    if (deepen) {
      return `${hello} — checking in, not pitching.\n\nI’ve been thinking about ${name} and what would actually help there now. If there’s a small next thing that would serve the space or the people already gathering, I’d rather hear that from you than invent an offer.\n\nNo deck. Just a deepen.`;
    }

    const quoteLine = quote ? `\n\nA line that stayed with me from your public pages: “${quote}”` : "";

    const openings = {
      warm: `${hello} — I’m Jordan, nearby in ${geo || "this corridor"}, working with HeartMind Spaces / Dissolve on how rooms and gatherings feel.\n\nI’ve been quietly paying attention to ${name}, especially ${signal.toLowerCase()}.${quoteLine}\n\nWould you be open to a short coffee? No pitch deck — just curious if there’s a small way we might be useful to each other.`,
      partner: `${hello} — I work with local designers and builders on finish painting that respects the last 10% of a project.\n\n${name} reads as craft over hustle from the outside, which is rare.${quoteLine}\n\n${offer.angle || "If a careful finishing partner would ever be useful on a live job, I’d like to stay on your radar."}`,
      workshop: `${hello} — I noticed ${name} already gathers people with care.\n\nI’m exploring one small co-hosted evening (practice / workshop), only if it helps your people rather than competing with what you already hold.${quoteLine}\n\nOpen to a conversation about whether that even belongs?`,
    };
    return openings[angle] || openings.warm;
  }

  function draftPacket(b, locked) {
    const body = previewOpening(b, locked);
    const emails = (b.contacts?.emails || []).map((e) => e.value).filter(Boolean);
    const phones = (b.contacts?.phones || []).map((p) => p.value).filter(Boolean);
    const contactLine = emails.length || phones.length
      ? `Public contact: ${[...emails, ...phones].join(" · ")}`
      : "Public contact: unknown — do not invent. Use the site form or a warm intro.";
    return `${body}

—
Offer in the brief: ${b.suggestedOffer?.title || "—"}
${b.suggestedOffer?.angle || ""}

Must say: ${(b.suggestedOffer?.mustSay || []).join("; ") || "—"}
Must not say: ${(b.suggestedOffer?.mustNotSay || []).join("; ") || "—"}

${contactLine}
Sources: ${(b.sources || []).map((s) => s.url).join(" · ")}

Draft only. You send this from your own tools.`;
  }

  function renderDraft() {
    const ready = keptCandidates().filter((c) => state.tones[c.id] && briefFor(c));
    const c = ready.find((x) => x.id === state.toneId) || ready[0];
    const b = c ? briefFor(c) : null;
    const locked = c ? state.tones[c.id] : null;
    const draft = b && locked ? (locked.editedText || draftPacket(b, locked)) : "";
    $("#app").innerHTML = `
      <div class="page-head">
        <div>
          <span class="eyebrow">You send outside</span>
          <h1>Draft</h1>
          <p>Copy the note. Send it from your own mail or LinkedIn. This app never transmits.</p>
        </div>
      </div>
      ${
        ready.length
          ? `<div class="detail-layout">
              <div class="card section-card">
                ${ready
                  .map(
                    (p) =>
                      `<button type="button" class="tone-pick${c && p.id === c.id ? " active" : ""}" data-id="${p.id}">${escapeHtml(p.orgName)}</button>`
                  )
                  .join("")}
              </div>
              <div class="card section-card">
                <h3>${escapeHtml(c.orgName)}</h3>
                <p class="detail-sub">${escapeHtml(locked.angle)} · ${escapeHtml(locked.voice)} · locked ${formatWhen(locked.at)}</p>
                <textarea id="draft-text" rows="16" style="width:100%;margin-top:12px;border:1px solid var(--line);border-radius:14px;padding:14px;background:var(--surface);line-height:1.55">${escapeHtml(draft)}</textarea>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
                  <button type="button" class="button primary" id="copy-draft">Copy draft</button>
                  <button type="button" class="button outline" id="export-decisions-2">Export decisions</button>
                </div>
                <p class="tone-stub-note">Draft-only. Human pressed Keep. You press send elsewhere.</p>
              </div>
            </div>`
          : `<div class="card deck-empty"><h2>No locked tones yet</h2><p>Keep a brief, lock a tone, then a draft appears here.</p></div>`
      }
    `;
    $$(".tone-pick").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.toneId = btn.dataset.id;
        render();
      })
    );
    $("#copy-draft")?.addEventListener("click", async () => {
      const text = $("#draft-text")?.value || "";
      if (c) {
        state.tones[c.id] = { ...state.tones[c.id], editedText: text };
        saveStore();
      }
      try {
        await navigator.clipboard.writeText(text);
        toast("Draft copied · send it yourself");
      } catch (_) {
        $("#draft-text")?.select();
        toast("Select and copy the draft");
      }
    });
    $("#export-decisions-2")?.addEventListener("click", exportDecisions);
    $("#draft-text")?.addEventListener("blur", () => {
      if (!c) return;
      state.tones[c.id] = { ...state.tones[c.id], editedText: $("#draft-text").value };
      saveStore();
    });
  }

  /* ——— Helpers ——— */

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function render() {
    setPipeline(state.view);
    setNav(state.view === "detail" ? "library" : state.view);
    const map = {
      discover: renderDiscover,
      library: renderLibrary,
      detail: renderDetail,
      deck: renderDeck,
      decisions: renderDecisions,
      tone: renderTone,
      draft: renderDraft,
    };
    (map[state.view] || renderLibrary)();
  }

  function showHelp() {
    const modal = $("#modal");
    $("#modal-body").innerHTML = `
      <p><strong>Outreach Deck</strong> is DissolveO’s cold / new-market research workspace — companion to Invite Buckets (warm circle).</p>
      <p><strong>Spine:</strong> Research + briefing. Swipe Keep / Pass is only the review gate after a brief exists.</p>
      <p><strong>Tracks:</strong> HeartMind Spaces (painting / space partners) and Dissolve (workshops / therapy / hosts).</p>
      <p><strong>Geo:</strong> Grey Highlands &amp; Collingwood; Simcoe (Barrie, Innisfil, Orillia); Newmarket. Muskoka out.</p>
      <p><strong>Non-negotiable:</strong> draft-only. This app never sends email, SMS, or LinkedIn messages.</p>
      <p style="margin-top:14px;font-size:11px;color:var(--faint)">Sample firms are fictional for P0. Decisions persist in localStorage key <code>${STORAGE_KEY}</code>.</p>
    `;
    modal.hidden = false;
  }

  function bindGlobal() {
    $$(".nav-item").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.view = btn.dataset.view;
        if (state.view === "deck") state.deckIndex = 0;
        render();
      })
    );
    $("#help-btn").addEventListener("click", showHelp);
    $("#modal-close").addEventListener("click", () => {
      $("#modal").hidden = true;
    });
    $("#modal").addEventListener("click", (e) => {
      if (e.target === $("#modal")) $("#modal").hidden = true;
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") $("#modal").hidden = true;
      if (state.view !== "deck") return;
      if (e.target.matches("input, textarea, select")) return;
      const queue = unreviewedBriefs();
      const c = queue[state.deckIndex];
      if (!c) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        animateDecide(c.id, "passed");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        animateDecide(c.id, "kept");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        animateDecide(c.id, "later");
      } else if (e.key === " " || e.key === "Enter") {
        if (e.target.closest("button")) return;
        e.preventDefault();
        openDetail(c.id);
      }
    });
  }

  async function init() {
    loadStore();
    bindGlobal();
    try {
      const [candRes, briefRes] = await Promise.all([
        fetch("data/candidates.json"),
        fetch("data/briefs.json"),
      ]);
      if (!candRes.ok || !briefRes.ok) throw new Error("Failed to load seed data");
      const candData = await candRes.json();
      const briefData = await briefRes.json();
      state.meta = candData.meta;
      state.candidates = candData.candidates || [];
      (state.extraCandidates || []).forEach((c) => {
        if (!state.candidates.some((x) => x.id === c.id)) state.candidates.push(c);
      });
      state.briefs = Object.fromEntries((briefData.briefs || []).map((b) => [b.id, b]));
      $("#loading").hidden = true;
      $("#app").hidden = false;
      render();
    } catch (err) {
      $("#loading").innerHTML = `<span>Could not load seed JSON. Serve this folder over HTTP (see README).</span>`;
      console.error(err);
    }
  }

  init();
})();
