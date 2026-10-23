/**
 * 대한민국 수학교육상 초등 부문 공동집필 홈페이지 — 의견 저장소
 *
 *  · 구글 시트를 데이터베이스로 씁니다. (Supabase 처럼 안 쓰면 잠기는 일이 없습니다)
 *  · 시트는 이 스크립트가 처음 실행될 때 자동으로 만들어집니다. 미리 만들 필요 없습니다.
 *
 *  배포 방법
 *    1) 이 코드를 Apps Script 편집기에 통째로 붙여넣고 저장
 *    2) 오른쪽 위 [배포] → [새 배포] → 유형 [웹 앱]
 *         - 설명        : 아무거나
 *         - 실행 계정    : 나
 *         - 액세스 권한  : 모든 사용자
 *    3) [배포] → 권한 승인 → 끝나면 나오는 .../exec 주소를 복사
 *    4) 홈페이지 js/config.js 의 SHEET_API_URL 에 붙여넣기
 *
 *  코드를 고쳐서 다시 배포할 때는 [배포] → [배포 관리] → 연필 → 버전 [새 버전] → [배포]
 *  (이렇게 해야 .../exec 주소가 그대로 유지됩니다)
 */

var SHEET_NAME  = 'comments';
var SHEET_TITLE = '수학교육상 공동집필 — 의견 기록';
var HEADERS     = ['id', 'topic_id', 'author', 'body', 'created_at'];

var MAX_AUTHOR = 40;
var MAX_BODY   = 2000;

/* ── 시트 준비 ─────────────────────────────────────── */
function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss = null;

  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (err) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(SHEET_TITLE);
    props.setProperty('SHEET_ID', ss.getId());
  }

  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    var def = ss.getSheetByName('시트1') || ss.getSheetByName('Sheet1');
    if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  }
  return sh;
}

/* ── 공통 ──────────────────────────────────────────── */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function rows_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    out.push({
      id:         String(r[0]),
      topic_id:   String(r[1]),
      author:     String(r[2]),
      body:       String(r[3]),
      created_at: r[4] instanceof Date ? r[4].toISOString() : String(r[4])
    });
  }
  out.sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
  return out;
}

function clean_(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

/* ── 읽기 ──────────────────────────────────────────── */
function doGet(e) {
  try {
    var list = rows_(getSheet_());
    var topic = e && e.parameter && e.parameter.topic;
    if (topic) {
      list = list.filter(function (r) { return r.topic_id === topic; });
    }
    return json_({ ok: true, rows: list });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ── 쓰기 · 삭제 ───────────────────────────────────── */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var req = {};
    if (e && e.postData && e.postData.contents) {
      req = JSON.parse(e.postData.contents);
    }
    var sh = getSheet_();

    if (req.action === 'add') {
      var author = clean_(req.author, MAX_AUTHOR);
      var body   = clean_(req.body,   MAX_BODY);
      var topic  = clean_(req.topic_id, 80);
      if (!author || !body || !topic) {
        return json_({ ok: false, error: '작성자·내용·항목이 필요합니다.' });
      }
      var row = {
        id:         Utilities.getUuid(),
        topic_id:   topic,
        author:     author,
        body:       body,
        created_at: new Date().toISOString()
      };
      sh.appendRow([row.id, row.topic_id, row.author, row.body, row.created_at]);
      return json_({ ok: true, row: row });
    }

    if (req.action === 'delete') {
      var id = clean_(req.id, 80);
      if (!id) return json_({ ok: false, error: 'id 가 필요합니다.' });
      var last = sh.getLastRow();
      if (last >= 2) {
        var ids = sh.getRange(2, 1, last - 1, 1).getValues();
        for (var i = ids.length - 1; i >= 0; i--) {
          if (String(ids[i][0]) === id) { sh.deleteRow(i + 2); break; }
        }
      }
      return json_({ ok: true });
    }

    return json_({ ok: false, error: '알 수 없는 action: ' + req.action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* ── 편집기에서 한 번 눌러 확인해 보는 용도 ──────────── */
function 설치확인() {
  var sh = getSheet_();
  var url = sh.getParent().getUrl();
  Logger.log('시트가 준비되었습니다: ' + url);
  Logger.log('현재 의견 수: ' + rows_(sh).length);
  return url;
}
