/**
 * Michael Fitness — Google Sheet sync
 * ---------------------------------------------------------------
 * Paste this into Extensions > Apps Script on the Sheet you want to
 * use, then Deploy > New deployment > Web app.
 *
 *   Execute as:      Me
 *   Who has access:  Anyone
 *
 * Copy the /exec URL it gives you and paste it into the app's
 * Settings > Google Sheet sync field.
 *
 * The app POSTs a finished session here and the script writes one row
 * per logged set. A GET returns everything back, which is what the
 * app's Restore button uses on a new phone.
 * ---------------------------------------------------------------
 */

// Optional. Set to a word of your choosing and put the same word in the
// app's Settings, and the script will ignore anything without it.
// Leave as '' to accept everything.
const TOKEN = '';

const SHEET_NAME = 'log';

const HEADERS = [
  'session_id', 'date', 'programme', 'workout', 'week', 'phase',
  'exercise', 'set', 'weight', 'reps', 'seconds'
];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** The app sends a finished session here. */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (TOKEN && body.token !== TOKEN) {
      return json_({ ok: false, error: 'bad token' });
    }

    const s = body.session;
    if (!s || !s.id) return json_({ ok: false, error: 'no session' });

    const sh = sheet_();

    // Don't write the same session twice. The app retries after a failed
    // upload and cannot always tell whether the first attempt landed.
    const ids = sh.getLastRow() > 1
      ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(r => String(r[0]))
      : [];
    if (ids.indexOf(String(s.id)) !== -1) {
      return json_({ ok: true, duplicate: true });
    }

    const rows = (s.entries || []).map(en => ([
      s.id, s.date, s.name || s.programme || '', s.workout || '',
      s.week || '', s.phase || '',
      en.n || '', en.label || '',
      en.weight == null ? '' : en.weight,
      en.reps   == null ? '' : en.reps,
      en.sec    == null ? '' : en.sec
    ]));

    if (rows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    }

    return json_({ ok: true, rows: rows.length });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** The app's Restore button reads everything back from here. */
function doGet(e) {
  try {
    if (TOKEN && (!e.parameter || e.parameter.token !== TOKEN)) {
      return json_({ ok: false, error: 'bad token' });
    }

    const sh = sheet_();
    if (sh.getLastRow() < 2) return json_({ ok: true, sessions: [] });

    const values = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.length).getValues();

    // Rebuild sessions from the flat rows.
    const bySession = {};
    values.forEach(r => {
      const id = String(r[0]);
      if (!id) return;
      if (!bySession[id]) {
        bySession[id] = {
          id: Number(id) || id,
          date: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
          name: r[2], programme: r[2],
          workout: r[3], week: r[4], phase: r[5],
          entries: []
        };
      }
      const en = { n: r[6], label: r[7], done: true };
      if (r[8] !== '' && r[8] != null) en.weight = Number(r[8]);
      if (r[9] !== '' && r[9] != null) en.reps   = Number(r[9]);
      if (r[10] !== '' && r[10] != null) en.sec  = Number(r[10]);
      bySession[id].entries.push(en);
    });

    const sessions = Object.keys(bySession)
      .map(k => bySession[k])
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    return json_({ ok: true, sessions: sessions });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
