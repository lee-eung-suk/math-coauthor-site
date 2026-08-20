# 댓글 공유 켜기 — Supabase 설정 (10분)

> 이 설정을 하기 전에도 페이지는 정상적으로 열립니다.
> 다만 댓글이 **내 브라우저에만** 저장됩니다. 아래를 마치면 네 분이 같은 댓글을 보게 됩니다.

---

## 1단계 · 프로젝트 만들기

1. https://supabase.com 로그인 → 초록색 **`New project`**
2. 입력
   - **Name** : `math-coauthor`
   - **Database Password** : **`Generate a password`** 눌러 자동 생성 → 메모장에 복사해 두기
     - ⚠️ 앱에서는 쓰지 않지만 나중에 필요할 수 있습니다. 저에게 알려주지 마세요.
   - **Region** : `Northeast Asia (Seoul)`
   - Plan : **Free**
3. **`Create new project`** → 약 2분 대기

---

## 2단계 · 표 만들기

1. 왼쪽 메뉴 **`SQL Editor`** → **`New query`**
2. 이 폴더의 **`supabase_setup.sql`** 을 열어 **전체 복사** → 붙여넣기 (내용 수정 금지)
3. 오른쪽 아래 **`Run`** (또는 `Cmd + Enter`)
4. 아래 표가 나오면 성공

   | tablename | RLS 켜짐 |
   |---|---|
   | comments | true |

   > 빨간 에러가 뜨면 문구를 그대로 복사해서 알려주세요.

---

## 3단계 · 키 두 개 복사하기

1. 왼쪽 아래 **`Project Settings`**(톱니바퀴) → **`API`**
2. 두 가지를 복사합니다.
   - **Project URL** — `https://xxxxxxxx.supabase.co`
   - **anon / public** key — 아주 긴 문자열
   > ⚠️ `service_role` 키는 **절대** 복사하지 마세요. (관리자 키입니다)

---

## 4단계 · 키 넣기

`js/config.js` 파일을 열어 따옴표 안에만 붙여넣습니다.

```js
export const SUPABASE_URL      = 'https://xxxxxxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOi....(아주 긴 문자열)';
```

저장하고 페이지를 새로고침하면, 화면 맨 아래에
**"댓글: Supabase 공유 모드"** 라고 표시됩니다. 이러면 끝입니다.

---

## 자주 나오는 질문

**Q. anon key 를 GitHub 에 올려도 되나요?**
네, 됩니다. anon key 는 공개용 키입니다. 다만 이 페이지는 **링크를 아는 사람이면 누구나 댓글을 쓸 수 있는** 구조이므로, 주소를 네 분끼리만 공유해 주세요.

**Q. 댓글 삭제 버튼이 안 보여요.**
자기가 쓴 댓글에만 삭제 버튼이 뜹니다(브라우저에 기록해 둡니다). 다른 기기에서 쓴 댓글은 그 기기에서 지워 주세요.

**Q. 나중에 댓글을 전부 지우고 싶어요.**
SQL Editor 에서 `delete from public.comments;` 를 실행하면 됩니다.
