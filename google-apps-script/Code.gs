/**
 * ori · igi — booking logger
 * Receives a booking POST from the website and:
 *   1. appends a full-detail row to the "Bookings" sheet
 *   2. emails NOTIFY_EMAIL a copy of the order
 *
 * Setup steps are in SETUP.md (same folder).
 */

// ── EDIT THIS ──────────────────────────────────────────────────────────
var NOTIFY_EMAIL = 'oriigiflame@gmail.com';   // where booking alerts are sent
var SHEET_NAME   = 'Bookings';
// ───────────────────────────────────────────────────────────────────────

var HEADERS = [
  'Timestamp', 'Name', 'Phone', 'Email', 'Address',
  'Order', 'Total guests',
  'Subtotal (NGN)', 'Delivery (NGN)', 'Full service', 'Service fee (NGN)', 'Total (NGN)'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    sheet.appendRow([
      new Date(),
      data.name || '',
      data.phone || '',
      data.email || '',
      data.address || '',
      data.orderSummary || '',
      data.guestsTotal || 0,
      data.subtotal || 0,
      data.delivery || 0,
      data.serviceIncluded ? 'Yes' : 'No',
      data.serviceFee || 0,
      data.total || 0
    ]);

    sendNotification(data);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Lets you open the /exec URL in a browser to confirm it is live.
function doGet() {
  return ContentService.createTextOutput('ori · igi booking endpoint is live.');
}

function sendNotification(data) {
  if (!NOTIFY_EMAIL) return;
  var money = function (n) { return 'NGN ' + Number(n || 0).toLocaleString('en-NG'); };
  var items = (data.items || []).map(function (it) {
    return '- ' + it.name + ' — ' + it.guests + ' guests — ' + money(it.lineTotal);
  }).join('\n');

  var body =
    'New booking from ' + (data.name || '') + '\n\n' +
    'ORDER\n' + items + '\n\n' +
    'Subtotal: ' + money(data.subtotal) + '\n' +
    'Delivery & setup: ' + money(data.delivery) + '\n' +
    (data.serviceIncluded ? 'Full service: ' + money(data.serviceFee) + '\n' : '') +
    'Total: ' + money(data.total) + '\n\n' +
    'CONTACT\n' +
    'Name: ' + (data.name || '') + '\n' +
    'Phone: ' + (data.phone || '') + '\n' +
    'Address: ' + (data.address || '') + '\n' +
    'Email: ' + (data.email || '');

  MailApp.sendEmail(NOTIFY_EMAIL, 'New ori · igi booking — ' + (data.name || ''), body);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
