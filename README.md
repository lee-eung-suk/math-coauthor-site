# 대한민국 수학교육상 초등 부문 공동집필 — 작업 홈페이지

김진호 · 이응석 · 차소정 · 오유경 네 저자의 공동집필 작업 공간.
빌드 도구 없이 열리는 정적 웹페이지입니다.

**공개 주소 (Vercel · 이 주소를 공유하세요)**
→ https://math-coauthor-site.vercel.app/

예비 주소 (GitHub Pages) → https://lee-eung-suk.github.io/math-coauthor-site/

## 구성

```
index.html            한 페이지 전체
css/style.css         디자인 (라이트/다크 자동)
js/data.js            ← 협의 내용. 내용 수정은 대부분 여기서만
js/config.js          ← Supabase 키 (댓글 공유용)
js/comments.js        댓글 저장 (Supabase / 브라우저 이중)
js/app.js             화면 조립
supabase_setup.sql    댓글 테이블 생성 SQL
SUPABASE_설정.md      댓글 공유 켜는 방법 (10분)
```

## 열어보기

ES 모듈을 쓰므로 파일을 더블클릭하면 동작하지 않습니다. 간단한 서버로 여세요.

```bash
cd math-coauthor-site && python3 -m http.server 8080
```

그리고 http://localhost:8080 접속.

## 내용 고치기

`js/data.js` 의 `TOPICS` 배열을 고치면 협의 카드가 바뀝니다.
항목을 추가하려면 `{ id, title, summary, tags, html }` 하나를 배열에 더하면 됩니다.
`id` 는 댓글이 붙는 기준이므로 **한 번 정한 뒤 바꾸지 마세요.**

## 배포 (설정 완료됨)

`lee-eung-suk/math-coauthor-site` 저장소의 `main` 브랜치가
**Vercel** 과 **GitHub Pages** 양쪽에 연결되어 있습니다.
고친 뒤 push 하면 Vercel 은 10~20초, GitHub Pages 는 1~2분 안에 반영됩니다.

```bash
git add -A && git commit -m "내용 수정" && git push
```

검색엔진 색인은 `noindex` 로 막아 두었습니다. 다만 저장소가 public 이므로
**주소를 아는 사람은 볼 수 있습니다.** 링크는 네 분끼리만 공유해 주세요.
