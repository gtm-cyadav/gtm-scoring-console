# Lead capture setup

Turns the "Leave this record" button on the site into rows in a Google Sheet. Five minutes, no third-party account, no submission limit.

Until `CAPTURE_ENDPOINT` in `index.html` has a URL in it, the button stays hidden and the site sends nothing.

## 1. Make the sheet

Create a new Google Sheet. Name it something like **GTM Console — leads**. Leave it empty; the script creates the tab and headers on the first submission.

## 2. Add the script

In that sheet: **Extensions → Apps Script**. Delete whatever is in `Code.gs` and paste the contents of [`Code.gs`](Code.gs). Save.

## 3. Deploy it

**Deploy → New deployment → Select type → Web app**, then:

| Field | Value |
|---|---|
| Description | `capture v1` |
| Execute as | **Me** |
| Who has access | **Anyone** |

Click **Deploy**. Google asks you to authorise it — it's your own script writing to your own sheet, so approve it. On the "Google hasn't verified this app" screen, choose **Advanced → Go to (project name)**.

Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy…/exec`.

"Anyone" means anyone who knows that URL can append a row. It cannot read the sheet, and the URL is unguessable. If it ever gets abused, create a new deployment and the old URL dies.

## 4. Wire it into the site

In `index.html`, near the top of the script block:

```js
var CAPTURE_ENDPOINT = "https://script.google.com/macros/s/AKfy…/exec";
```

Commit and push. GitHub Pages redeploys in a minute or two.

## 5. Check it

Open the live site, fill in the enrichment fields, scroll to **05 Route** and press **Leave this record**. A row should appear in the sheet within a second or two.

Opening the web app URL directly in a browser returns `{"ok":true,...}` — a quick way to confirm the deployment is alive.

## What gets stored

One row per submission: timestamp, lead_id, name, company, seniority, company size, intent, role track, score, probability, engagement depth, source, device, and the optional note.

Nothing is sent unless the visitor presses the button, and the page says so in its footer. Keep it that way — silently logging what people type would contradict a promise the page makes to its readers.

## Getting notified

Apps Script can email you on each new lead. Add this to `Code.gs` inside `doPost`, just before `return json_({ ok: true })`:

```js
MailApp.sendEmail(
  'chetan00yadav@gmail.com',
  'New lead: ' + str_(data.name) + ' (' + data.score + '/100)',
  JSON.stringify(data, null, 2)
);
```

Re-deploy afterwards (**Deploy → Manage deployments → edit → New version**), or the change won't go live.
