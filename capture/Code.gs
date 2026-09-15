/**
 * Lead capture for gtm-scoring-console.
 *
 * Receives a scored lead record from the site, appends it as a row, and
 * emails a notification. Setup instructions are in capture/README.md.
 */

var SHEET_NAME = 'leads';
var NOTIFY_EMAIL = 'chetan00yadav@gmail.com';
var NOTIFY = true;

var COLUMNS = [
  'received_at', 'lead_id', 'name', 'email', 'company', 'seniority',
  'company_size', 'intent', 'role_track', 'score', 'probability',
  'engagement', 'source', 'device', 'note'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    getSheet_().appendRow([
      new Date(),
      str_(data.lead_id), str_(data.name), str_(data.email), str_(data.company),
      str_(data.seniority), str_(data.size), str_(data.intent), str_(data.track),
      data.score, data.probability, data.engagement,
      str_(data.source), str_(data.device), str_(data.note)
    ]);
    // The row is already safe; a mail failure must not fail the request.
    if (NOTIFY) {
      try { notify_(data); } catch (mailErr) { console.error(mailErr); }
    }
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

function notify_(data) {
  var who = str_(data.name) || 'Anonymous';
  var where = str_(data.company);
  var score = data.score === undefined ? '?' : data.score;

  var body = [
    who + (where ? ' at ' + where : ''),
    'Scored ' + score + '/100  (p = ' + data.probability + ')',
    '',
    'Reading for:  ' + str_(data.track),
    'Seniority:    ' + str_(data.seniority),
    'Company size: ' + str_(data.size),
    'Intent:       ' + str_(data.intent),
    'Email:        ' + (str_(data.email) || 'not given'),
    '',
    'What they wrote:',
    str_(data.note) || '(nothing)',
    '',
    '---',
    'Engagement depth ' + data.engagement + ' · ' + str_(data.source) +
      ' · ' + str_(data.device) + ' · ' + str_(data.lead_id)
  ].join('\n');

  var options = { name: 'GTM Scoring Console' };
  if (isEmail_(data.email)) options.replyTo = String(data.email).trim();

  MailApp.sendEmail(
    NOTIFY_EMAIL,
    'Lead ' + score + '/100 — ' + who + (where ? ' @ ' + where : ''),
    body,
    options
  );
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  // Self-heals the header row when the columns change.
  var header = sheet.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
  if (header.join('|') !== COLUMNS.join('|')) {
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function isEmail_(v) {
  return !!v && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v).trim());
}

/** Leading '=', '+', '-' or '@' would otherwise be read as a formula. */
function str_(v) {
  if (v === null || v === undefined) return '';
  var s = String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
