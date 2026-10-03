# Tally: Task Breakdown

## MVP

A user enters income + province, sees their federal tax broken down by where it goes, browses real federal spending stories with their personal share of each, and starts or joins a campaign on that story in the app. Once a campaign has enough supporters, our team asks an MP to sponsor it, opens the official e-petition on ourcommons.ca, and emails every supporter a link to sign it there.

**In the MVP:** 6 screens (layout from the wireframe), real tax math, real government spending data, stories from that data plus news, real MP lookup, Auth0 login only when someone starts, joins or leaves a campaign.

**Not in the MVP (stretch):** automated emails through an email service (e.g. telling members when their campaign changes stage, reminders), syncing official signature counts + the government's response from ourcommons.ca, auto-closing campaigns at the deadline, signature trend charts, provincial items.

**Ground rules**
- Browsing needs no account: the receipt, stories, campaigns and petitions are public. Auth0 login is asked for only when someone acts (start, join, leave or edit a campaign), and the header has an optional "Log in" link.
- Income never leaves the device. The tax calculation runs on the client.
- Only federal items get a campaign card. House of Commons e-petitions can't cover provincial spending.
- **Our app builds support; the official petition lives on ourcommons.ca.** Joining in the app is support, not a signature. Everyone signs again on ourcommons.ca.
- A story can have many campaigns, but each person can start only one per story. The starter writes it ("Start a campaign") and is its first member; others tap "Join" on the one they support, which shares their name, email and riding (with consent) so an MP can verify supporters.
- **Only petitions from our own campaigns.** We don't search ourcommons.ca for other people's e-petitions or match them to stories.
- **No email service in the MVP.** Emails are sent by hand: the MP ask and the "sign it now" message go from the app's Gmail account (compose links / BCC), and the ourcommons.ca account is registered with a team member's personal email.
- **Target: 1,000 supporters** (2× the 500 signatures ourcommons.ca needs, assuming about half sign officially). **Deadline: 30–120 days**, same as an e-petition.
- **Our team is the petitioner on ourcommons.ca.** One person can have only one petition open for signatures at a time, so each official petition is opened by a different team member (real name, city, postal code, phone; the name is published).
- **The wireframe is a layout guide only.** Its numbers, labels and dates are placeholders. Real numbers come from the data.

## Decisions made

1. **Spending data source:** GC InfoBase open data ([dataset page](https://open.canada.ca/data/en/dataset/a35cf382-690c-4221-a971-cf0fd189a46f)). Three files:
   - [programs_spending.csv](https://open.canada.ca/data/dataset/a35cf382-690c-4221-a971-cf0fd189a46f/resource/55934650-3380-44d5-82c1-bb68f8cc5abb/download/programs_spending.csv): how much each program spent per year. Use the `expenditure` column (actual spending).
   - [programs.csv](https://open.canada.ca/data/dataset/a35cf382-690c-4221-a971-cf0fd189a46f/resource/8d3cd22d-15b0-468a-bb75-c1e736107c45/download/programs.csv): program names. Join on `year` + `dept_code` + `program_code`.
   - [organizations.csv](https://open.canada.ca/data/dataset/a35cf382-690c-4221-a971-cf0fd189a46f/resource/d9f87f7f-62f9-4baf-a803-2d8743f38e76/download/organizations.csv): department names. Join on `dept_code`.
2. **Year meaning:** `2024` in the data = April 2024 to March 2025 (checked: Canada Health Transfer shows $52.1B, the official 2024–25 amount). Label it "2024–25" in the app.
3. **Your share formula (same on every screen):**
   `your share = your federal tax × (item cost ÷ total federal spending that year)`
   Example: you pay $9,510, military aircraft cost $3.3B, total spending ~$520B → $9,510 × (3.3 ÷ 520) ≈ **$60**. "Total federal spending" = sum of `expenditure` in programs_spending.csv for that year. Raphael computes it once and everyone uses that number.
4. **Screen 02 breakdown:** show the 7 biggest programs with plain-English names (e.g. "Market Debt and Foreign Reserves Management" → "Interest on the debt"), plus one "All other programs" bar. Only 7 names to rewrite by hand.
5. **Feed filter chips:** filter by department (e.g. "National Defence", "Health"). The department comes free with every row of the data, so there's no manual sorting.
6. **Stories come from two places:**
   - **Data stories (main source):** programs whose spending jumped a lot from one year to the next. Example: military aircraft buying went from $0.8B (2022–23) to $3.3B (2024–25) → "Military aircraft spending quadrupled in two years."
   - **News stories (extra):** scraped news for things the data doesn't show, like one-off contracts.

## Branches

One branch per task, named `<area>/<task>` (listed under each task below). Merge into `main` via PR when a phase works.

## Who owns what

| Person | Area |
|---|---|
| **Izu** | UI: all 6 screens |
| **Raphael** | Data: tax calculator, breakdown, spending API, official petitions (`/api/petitions`) |
| **Great** | Stories: data stories, news scraping, campaigns (start + join) |
| **Muktar** | Everything else: Auth0, MP lookup, draft flow, admin page, deploy, demo |

## Shared contract (agree on this first, together)

The spending item (story) shape everyone builds against:

```json
{
  "id": "string",
  "title": "Military aircraft spending quadrupled in two years",
  "summary": "What happened, neutral tone",
  "amount": 3263727280,
  "date": "2025-03-31",
  "fiscal_year": "2024-25",
  "department": "National Defence",
  "dept_code": "ND",
  "program_code": "BUR03",
  "source_type": "data",
  "level": "federal",
  "sources": [{ "label": "GC InfoBase: Federal Programs Spending", "url": "https://..." }],
  "image_url": "https://...",
  "campaigns": [{
    "id": "string",
    "title": "...",
    "starter": "Ana",
    "supporters": 412,
    "target": 1000,
    "deadline": "2026-12-25",
    "status": "gathering",
    "joined": false,
    "petition": {
      "number": "e-5123",
      "url": "https://www.ourcommons.ca/petitions/en/Petition/Details?Petition=e-5123",
      "signatures": 318,
      "closes": "2027-02-01"
    }
  }]
}
```

- `source_type` is `"data"` (from the spending file) or `"news"` (scraped).
- `program_code` is filled for data stories, and for news stories when Great can match one.
- **Campaign** = the in-app part (start, join, 1,000 target). **Petition** = the official e-petition on ourcommons.ca.
- `campaigns` lists the story's campaigns (empty → "No campaigns yet. Start the first one."). Order: official first, then most supporters; closed ones last.
- `status`: `gathering` (collecting supporters) → `review` (hit the target, team checks it) → `sponsor_asked` (team emailed an MP) → `official` (live on ourcommons.ca) → `closed`.
- `petition` is `null` until the e-petition is live on ourcommons.ca (Raphael's `/api/petitions`). `joined` is whether the logged-in user has joined.
- Stories are **not** stored in the database. They live in Great's `pipeline/stories.json` + `pipeline/news_stories.json` and are read by `src/lib/stories.ts`. The database (Neon + Drizzle) holds users, drafts, campaigns, supporters, petitions and the GC InfoBase tables for the breakdown. Story `id`s never change, because campaigns point at them.

---

## Izu (UI)

### Task 1: Build the onboarding + tax overview (screens 01–02)
Branch: `ui/onboarding-overview`
- **Phase 1:** Set up the frontend project and design tokens (colours, type, spacing from the wireframe). Build screen 01 (income input with auto-format, province dropdown defaulting from locale) and screen 02 with mock numbers.
- **Phase 2:** Save income and province to local storage. Plug in Raphael's tax calculator and `GET /breakdown` (top 7 programs + "All other"). Horizontal bar list.
- **Phase 3:** "Edit" link back to 01, "How we calculate" link, loading/error states, check at 390pt width.

### Task 2: Build the spending feed + detail page (screens 03–04)
Branch: `ui/feed-detail`
- **Phase 1:** Create `mock/spending.json` (~5 items in the shared shape). Build feed cards, department filter chips, bottom tab bar and the detail page from mock data.
- **Phase 2:** Swap mock data for `GET /spending?department=` and `GET /spending/:id`. Show personal share using the formula in Decisions #3. Detail page in order: facts → "How this relates to you" → sources → action card.
- **Phase 3:** Campaigns section from `campaigns`: empty ("No campaigns yet. Start the first one."), each row gathering ("412 of 1,000 supporters", deadline, Join / Joined) or official ("Sign on ourcommons.ca" + official count). "Start a campaign" becomes "Your campaign" if you already started one on this story. Empty feed state, image fallbacks.

### Task 3: Build the petition flow (screens 05–06)
Branch: `ui/petition-flow`
- **Phase 1:** Screen 05 form (title with 250-char counter, issue with "Whereas" helper, requested action, 6-step explainer under the form). Screen 06 layout (postal code + Find, MP card, email template) with a sample MP.
- **Phase 2:** Wire to Muktar's draft endpoints. Step 2 becomes "Publish to the app" (the campaign goes live on its story for others to join) instead of the user emailing an MP. Step progress bar.
- **Phase 3:** Step 3 hand-off screen, validation messages, final visual pass across all screens.

---

## Raphael (Data)

### Task 1: Build the tax calculator + breakdown
Branch: `data/tax-breakdown`
- **Phase 1:** Tax calculator as a pure function: 2024 federal + provincial brackets → `{ federal, provincial, total, effectiveRate }`. Check a few incomes against an online Canadian tax calculator.
- **Phase 2:** From programs_spending.csv (2024–25): compute **total federal spending** (Decisions #3) and the top 7 programs. Write a plain-English name for each of the 7. Serve via `GET /breakdown` → `[{ name, amount, percent }]` + "All other programs".
- **Phase 3:** Unit tests for a few incomes per province. Write the "How we calculate" content with sources.

### Task 2: Build the spending API
Branch: `data/db-api`
- **Phase 1:** ~~Set up the database, `users`, `drafts`, drafts endpoints~~ Done by Muktar (Neon + Drizzle). ✅ GC InfoBase files loaded (`npm run db:load`) for the breakdown. Stories stay in JSON (see Shared contract).
- **Phase 2:** ✅ `GET /api/spending?department=`, `GET /api/spending/:id`, `GET /api/departments`, reading stories through `src/lib/stories.ts`. Each story also gets its `campaigns` (see Shared contract).

### Task 3: Build official petitions (`/api/petitions`) — MVP
Branch: `data/petitions`
A **petition** is the official e-petition on ourcommons.ca. It belongs to one in-app **campaign** (see Shared contract).
- **Phase 1:** Drizzle `petitions` table: `campaign_id` (unique), e-petition `number`, ourcommons.ca `url`, `petitioner` (which team member opened it), `signatures`, `status` (open / closed / presented / responded), `closes`, `created_at`.
- **Phase 2:** `POST /api/petitions` (team-only; the admin page calls it with the campaign id + number + url once a team member opens it on ourcommons.ca) sets the campaign's status to `official`. `GET /api/petitions/:id`. Each campaign's `petition` is filled from this table. Seed one official demo petition.
- **Phase 3 (stretch):** Scheduled sync from ourcommons.ca for our petitions only: signature count, open/closed, and the government's response (due within 45 days of being presented), shown on the story.
---

## Great (Stories)

### Task 1: Build data stories from spending jumps (main feed source)
Branch: `stories/data-stories`
- **Phase 1:** Using programs_spending.csv + programs.csv, find programs with the biggest jumps (or drops) between years, e.g. 2022–23 → 2024–25. Ignore tiny programs (e.g. under $50M) and `ISS` internal services rows. Pick ~20 good ones by hand.
- **Phase 2:** Script that turns each jump into a story in the shared shape: plain-English headline, neutral "What happened" summary (LLM can draft it from the program name + numbers), `source_type: "data"`. Push to `POST /internal/spending`.
- **Phase 3:** Hand-check the top ~15 stories so the demo feed is accurate and readable.

### Task 2: Build the news pipeline (extra stories)
Branch: `stories/news-pipeline`
- **Phase 1:** Pull CBC / CTV / Google News RSS with queries like "federal government spent", "contract", "$ million". Save raw articles locally.
- **Phase 2:** LLM extraction per article → `amount, department, date, level`, a neutral headline and summary. Drop `level: provincial`. Match to a `program_code` if possible. Push with `source_type: "news"`.
- **Phase 3:** Dedupe the same story across outlets. Find or generate images. Run it on a schedule.

### Task 3: Build campaigns (start + join) — MVP
Branch: `stories/campaigns`
No fuzzy matching: a campaign belongs to the story it was started from. A story can have many campaigns, one per person.
- **Phase 1:** Make news story ids stable: a merged story always keeps its earliest article's id, so a newer outlet never changes it. Drizzle tables: `campaigns` (story_id, started_by, title, issue, request, target 1,000, deadline, status; unique `story_id` + `started_by`) and `campaign_supporters` (campaign, user, name, email, riding, consent to share with an MP, joined at; one row per user per campaign). Seed 2–3 demo campaigns, one already at 1,000.
- **Phase 2:** `POST /api/campaigns` publishes a draft as a campaign on its story, with the starter as first member (if they already started one on this story, return that one). `POST /api/campaigns/:id/join`: one tap + consent; riding from the user's postal code via Muktar's MP lookup. At 1,000 supporters the status moves to `review`.
- **Phase 3:** Attach each story's `campaigns` (with `starter`, `supporters`, `target`, `deadline`, `status`, `joined`) to `/api/spending` and `/api/spending/:id`. Demo check: joining raises the count, no joining twice, no second campaign by the same person on a story, stories without one show the empty state.
---

## Muktar (Everything else)

### Task 1: Build auth (Auth0)
Branch: `platform/auth`
- **Phase 1:** Create the Auth0 tenant and app, share env vars with the team.
- **Phase 2:** Auth0 login in the frontend, asked for only when someone acts on a campaign. API routes check the session themselves (`requireUser`, `requireAdmin`).
- **Phase 3:** Create the user row on first login. Logged-out users can open any public screen, including direct links; only a starter's own pages (edit, live) send them to login.

### Task 2: Build MP lookup + sponsor email
Branch: `platform/mp-lookup`
- **Phase 1:** Test the Open North Represent API: `https://represent.opennorth.ca/postcodes/K1P1A4/` → MP name, riding, email, phones.
- **Phase 2:** `GET /mp?postal=` endpoint wrapping it (return only the federal MP). Sponsor email template filled from the draft + MP (becomes the MP ask in Task 4).
- **Phase 3:** "Send request by email" opens a `mailto:` link with subject and body. "Choose a different MP" flow. Handle bad postal codes.

### Task 3: Build the draft flow + deploy + demo
Branch: `platform/draft-deploy`
- **Phase 1:** Set up hosting (e.g. Vercel) with env vars so there's a deploy URL from the start.
- **Phase 2:** Draft flow: step 1 saves the draft, step 2 publishes it as a campaign on its story (Great's `POST /api/campaigns`) so others can join. The MP ask and the ourcommons.ca hand-off move to Task 4.
- **Phase 3:** End-to-end test of the full path on the deployed URL. Demo script, pitch deck, final deploy.


### Task 4: Build the admin page (hand-off to ourcommons.ca) — MVP
Branch: `platform/admin`
No email service: the team sends everything by hand from the app's Gmail account.
- **Phase 1:** Team-only admin page (`ADMIN_EMAILS` allowlist, checked on the server; others get "page not found"). Lists campaigns with members, stage and last updated; filter by stage. Campaign view: text, starter, members by riding, member table + CSV download.
- **Phase 2:** Pick the sponsor MP with the existing MP search. **MP ask** email built on the sponsor email ("This campaign has N members from M ridings, including X in yours. We can share the member list so you can verify them."), with Copy / Open in Gmail / Open in Outlook, sent from the app's Gmail. Stage buttons (can move back, e.g. if an MP says no), sets `sponsor_asked`.
- **Phase 3:** Record the ourcommons.ca number + link once a team member opens it (calls Raphael's `POST /api/petitions`, campaign becomes `official`). **Sign now** message ("It's live on ourcommons.ca, sign it here: <link>. Your signature only counts after you confirm the House of Commons email.") + "Copy member emails" for BCC.
---

## If time runs out, cut in this order

1. Stretch items (official sync + government response, reminders, auto-close, trend charts, provincial items)
2. News pipeline (data stories alone fill the feed)
3. Admin page (do the MP ask and the ourcommons.ca step by hand from the database, show it in the demo script)

Never cut: tax calc, breakdown, data stories, detail page, start + join a campaign, MP lookup, emailing supporters.
