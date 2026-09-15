# GTM Scoring Console

An interactive CV that scores the person reading it.

I built a [lead scoring pipeline](https://github.com/gtm-cyadav/gtm-lead-scoring) for a GTM team — PostgreSQL, a logistic regression model, a Slack bot that fires on hot leads. This page is that system, pointed at whoever opens it.

The visitor is the lead. They get ingested, enriched, scored and routed. Along the way the CV underneath re-ranks and rewrites itself for whichever role they say they're hiring for.

**Live:** enable GitHub Pages on this repo (Settings → Pages → Deploy from `main`, root).

## How it works

| Stage | What happens |
|---|---|
| 01 Ingest | A lead record is created on page load — session id, source, device, `days_since_engagement: 0` |
| 02 Enrich | The visitor fills in seniority, company size and intent, and picks the role they're hiring for. Each field shows its coefficient |
| 03 Score | Logistic regression: `p = 1 / (1 + exp(-z))`, MQL threshold at `p ≥ 0.70`. The SQL and Python panes rewrite themselves with the visitor's live values |
| 04 Match | Six evidence records ranked by relevance to the selected role, with the bullets and skill chips filtered to that role |
| 05 Route | Crossing the threshold fires a Slack-style alert; the handoff button opens a mail draft with the whole scored record in it |

### The model

Five features, fitted the same way as the production pipeline — check which signals predict conversion in SQL first, then fit a logistic regression so every score can explain itself.

```
z  = -3.20                      # intercept
z += seniority                  # ≤ 1.60
z += company_size               # ≤ 1.00
z += intent                     # ≤ 1.40  (strongest single predictor)
z += engagement_depth           # ≤ 2.40  (sections opened, links, dwell, scroll)
z += recency                    #   0.90  (engaged today)

p = 1 / (1 + exp(-z))
```

Feature contributions are shown live in the right rail, so the score is never a black box.

### Role tracks

Growth / GTM · Performance marketing · Brand & content · Market research & insights · E-commerce / D2C · Data & analytics

Same facts, argued for the job in front of them. Each evidence bullet and skill chip is tagged with the roles it's relevant to, and each record carries a per-role match score that drives the ordering.

## Running it

It's one file with no build step and no dependencies.

```bash
open index.html
```

Fonts come from Google Fonts; everything else is inline.

## Real lead capture

Scoring runs entirely in the browser — no analytics, no cookies, no network calls. The only thing that reaches me is what a visitor chooses to send via the mail handoff.

To capture leads properly when self-hosting, post the record to an n8n webhook inside the `handoff` click handler in `index.html`:

```js
fetch("https://<your-n8n-host>/webhook/lead", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: state.name, company: state.company,
    seniority: state.seniority, size: state.size,
    intent: state.intent, track: state.track,
    score: score, lead_id: leadId
  })
});
```

n8n then posts it to Slack, which closes the loop and makes this the same pipeline as the repo it's imitating.

## Stack

Vanilla HTML, CSS and JavaScript. Spectral, Archivo and IBM Plex Mono. No framework, no build, ~1,000 lines.

---

Chetan Yadav — Delhi, India
[chetan00yadav@gmail.com](mailto:chetan00yadav@gmail.com) · [github.com/gtm-cyadav](https://github.com/gtm-cyadav)
