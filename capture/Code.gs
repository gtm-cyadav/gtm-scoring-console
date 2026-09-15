/**
 * Lead capture for gtm-scoring-console.
 *
 * Receives a scored lead record from the site and appends it as a row.
 * Setup instructions are in capture/README.md.
 */

var SHEET_NAME = 'leads';

var COLUMNS = [
  'received_at', 'lead_id', 'name', 'company', 'seniority', 'company_size',
  'intent', 'role_track', 'score', 'probability', 'engagement', 'source',
  'device', 'note'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    getSheet_().appendRow([
      new Date(),
      str_(data.lead_id), str_(data.name), str_(data.company),
      str_(data.seniority), str_(data.size), str_(data.intent), str_(data.track),
      data.score, data.probability, data.engagement,
      str_(data.source), str_(data.device), str_(data.note)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Lets you confirm the deployment is alive by opening the URL in a browser. */
function doGet() {
  return json_({ ok: true, service: 'gtm-scoring-console capture' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Leading apostrophes and '=' would otherwise be read as formulas. */
function str_(v) {
  if (v === null || v === undefined) return '';
  var s = String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
