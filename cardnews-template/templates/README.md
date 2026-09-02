# 카드뉴스 슬라이드 템플릿

매일 새 주제로 카드뉴스를 만들 때, 이 폴더의 4개 템플릿을 복사해서 `__TOKEN__` 표시만 실제 내용으로 바꿔 넣는다. `{{ }}` 형식은 Design Components 자체 문법과 겹치므로 절대 쓰지 않고, `__TOKEN__` (더블 언더스코어) 형식만 사용한다.

## 채널 구조 (2026-09-01 확정 — 2개 채널로 분리)

타겟층이 너무 달라서 계정을 2개로 분리했다. 매일 아침 두 채널 모두 "아이템 뽑아줘 → (사람이) 제작할 것 결정 → 번호 지정해서 제작해줘" 순서로 진행한다.

| 채널 | 폴더 | 템플릿 | 카테고리(9개) |
|---|---|---|---|
| **cosmos.** (기존) | `runs/`, `output/` (접두어 없음) | `templates/` | 스니커즈, 패션, 영화, 식도락, 브랜드, 연예, 가십, 음악, 쇼핑 |
| **OWLSIGHT** (신규, 남성/경제 중심) | `runs-owlsight/`, `output-owlsight/` | `templates-owlsight/` | 경제일반, 주식, 부동산, AI, 가상화폐, 테크, 스타트업, 야구, 산업 |

- `tools/`, `pipeline/write_copy_guidelines.md`의 규칙(분량·최신성 등)은 두 채널 공통.
- OWLSIGHT는 `templates/`와 완전히 동일한 레이아웃·톤·이미지 규칙을 쓰되, 로고만 다르다 (아래 "OWLSIGHT 템플릿 차이점" 참고). 색상·타이포·사진 처리 방식은 손대지 않는다.
- 두 채널 다 `output/`, `output-owlsight/`가 프로젝트 루트 바로 아래(= `runs`/`runs-owlsight` 안쪽 아님)에 생기는 건 동일.

### 외부 소싱 워크플로우 (2026-09-02 확정)

기본 흐름("아이템 뽑아줘"로 리서치 에이전트가 찾아오는 것) 외에, 대표님이 매일 아침 외부 AI 도구로 직접 아이템 원고를 뽑아서 채팅에 붙여넣는 경로도 있다. 이쪽이 대체로 "야마"(훅)가 더 강함 — 리서치 에이전트는 훅 없는 밋밋한 발표문 나열에 그치기 쉬움.

들어오는 형식 예시: 카테고리별로 헤드라인 + 훅 카드 + 전개 카드 2~3장 + 마무리 한 줄 구조(원고 자체가 이미 카드뉴스 형태에 가까움).

이걸 받으면:
1. **카테고리 매핑** — 채널의 9개 고정 카테고리에 맞춰 분류. 초과분(9개 넘는 항목)이나 서로 다른 카테고리인데 같은 회사/사건이 중복되는 경우 플래그.
2. **팩트 검증** — 원고가 대표님 소유 저작물이라 저작권 문제는 없지만, 외부 AI 도구가 생성한 숫자는 틀릴 수 있어서 특히 의외의 수치(급등락%, 금리, 밸류에이션 등)는 원출처로 재확인 후 진행.
3. **우리 카피로 리라이팅** — 원고의 훅/구조는 참고하되, 문장은 새로 씀 (원고 헤드라인을 그대로 옮기지 않음 — 설령 대표님 저작물이라도 우리 템플릿 분량 규칙에 맞게 재구성 필요). 훅→Cover 헤드라인+서브카피, 전개 카드→Point 본문(2~3문장 규칙), 마무리→Closing 한 줄.
4. 이후 파이프라인(이미지 소싱·캔버스 게시·PNG 추출)은 기존과 동일.

### OWLSIGHT 템플릿 차이점

`templates-owlsight/`는 `templates/`를 그대로 복사한 뒤 로고 부분만 바꾼 것 — 나머지 토큰·구조는 100% 동일.

- **하단 브랜드 틱** (Cover/Point/Stat 좌하단): `cosmos.` 대신 `OWLSIGHT | __CATEGORY_TAG__` — 폰트는 Syne이 아니라 **Unbounded**(800). 구분자는 슬래시가 아니라 세로 바(`|`, 흐린 색)이고, `__CATEGORY_TAG__`(카테고리명, 예: `주식`, `부동산`, `AI`)는 `OWLSIGHT`와 같은 색(무게만 500으로 더 얇음)으로 통일돼 있다 — 카테고리 텍스트를 흐리게 하지 말 것.
- **클로징 로고** (Closing 중앙, 56px): 카테고리 없이 `OWLSIGHT`만, 역시 Unbounded 800.
- 폰트 import에 `Unbounded:wght@500;800`이 추가돼 있고 Syne도 그대로 남아있음 (헤드라인 텍스트는 여전히 Syne 사용 — 로고만 바뀐 것). Unbounded는 한글 글리프가 없으므로 카테고리 텍스트가 `Noto Sans KR`로 자동 대체되도록 `font-family` 스택에 명시해뒀다.

## 슬라이드 구성 규칙

- **Cover.dc.html** — 항상 1장, 캐러셀 맨 앞. 다크 배경 + 사진.
- **Point.dc.html** — 필요한 개수만큼 복제 (보통 2~4장). 라이트 배경 + 사진 (모든 카드가 배경 사진을 쓴다, 아래 "사진·크레딧 규칙" 참고).
- **Stat.dc.html** — 0~1장. 강조할 숫자/통계가 있을 때만 사용. 다크 배경 + 사진.
- **Closing.dc.html** — 항상 1장, 캐러셀 맨 끝. 다크 배경 + 사진.

즉 한 세트는 `Cover(1) + Point(N) + Stat(0~1) + Closing(1)` = 총 3~7장 정도로 아이템에 따라 유동적이다.

## 각 템플릿의 토큰

| 파일 | 토큰 | 설명 |
|---|---|---|
| Cover.dc.html | `__COVER_BG__` | 배경 이미지 파일명 (예: `cover-bg.jpg`) |
| | `__HEADLINE__` | 훅 헤드라인. 줄바꿈은 `<br>` 직접 삽입, 한 줄에 6~9음절 정도로 짧게. 템플릿이 이미 `<span class="hl">`로 감싸놓아서 전체가 자동으로 형광펜 강조됨 (아래 "형광펜 강조" 참고) — 토큰만 채우면 됨, 추가 마크업 불필요 |
| | `__SUBCOPY__` | 헤드라인 아래 한 줄 부연 설명 |
| | `__PHOTO_CREDIT__` | `이름 / 출처, 라이선스` 형식 (예: `Jonathan Combe / Flickr, CC BY 2.0`) |
| Point.dc.html | `__POINT_BG__` | 배경 이미지 파일명 |
| | `__HEADLINE__` | 이 포인트의 핵심 한 문장 |
| | `__BODY__` | 설명 본문 (2~4줄 분량). 핵심 숫자·키워드는 직접 `<span class="hl">982억 5000만 달러</span>`처럼 감싸서 부분 강조 (선택적 — 문장마다 강제 아님, 편집 판단) |
| | `__PHOTO_CREDIT__` | 위와 동일 형식 |
| Stat.dc.html | `__STAT_BG__` | 배경 이미지 파일명 |
| | `__STAT_NUMBER__` | 강조 숫자/통계 (짧게, 라틴 문자·숫자 위주 — Syne 폰트가 한글을 지원하지 않음) |
| | `__STAT_CAPTION__` | 숫자 설명 1~2문장 |
| | `__PHOTO_CREDIT__` | 위와 동일 형식 |
| Closing.dc.html | `__CLOSING_BG__` | 배경 이미지 파일명 |
| | `__CLOSING_LINE__` | 마무리 한 줄 (태그라인·CTA는 브랜드 고정 문구라 손대지 않음) |
| | `__PAGE_TOTAL__` | 전체 장수 숫자 두 자리 (예: `05`) — 두 곳 모두 같은 값으로 치환 |
| | `__PHOTO_CREDIT__` | 위와 동일 형식 |

## `<!--PROGRESS_BAR-->` 치환 규칙

모든 템플릿 상단에 있는 `<!--PROGRESS_BAR-->` 주석을 아래 구조로 치환한다 (INDEX = 이 슬라이드 순번(1부터), TOTAL = 전체 장수):

```html
<div style="position:absolute; top:40px; left:72px; right:72px; display:flex; gap:6px;">
  <!-- INDEX개: 채워진 색 -->
  <div style="flex:1; height:3px; background:{FILLED};"></div>
  <!-- (TOTAL-INDEX)개: 흐린 색 -->
  <div style="flex:1; height:3px; background:{DIM};"></div>
</div>
```

- 다크 배경(Cover/Stat/Closing): `FILLED = #fffefc`, `DIM = rgba(255,255,255,0.15)`
- 라이트 배경(Point): `FILLED = #111010`, `DIM = #e3e0dc`

## 형광펜 강조 (cosmos., 2026-09-02 확정)

경쟁 채널(예: newsourcemag) 벤치마킹 후 도입 — 핵심 문구를 형광 그린 블록으로 감싸 시선을 붙잡는 장치. `Cover.dc.html`, `Point.dc.html` `<style>`에 `.hl` 클래스가 정의돼 있음: `background:#39FF14; color:#111010;` (검정 텍스트만 — 흰 텍스트는 대비가 약해서 탈락시킴). 여러 줄에 걸쳐도 `box-decoration-break:clone`으로 줄마다 따로 박스가 그려짐.

- **Cover**: 헤드라인 전체가 템플릿에서 이미 `.hl`로 감싸져 있어 자동 적용됨.
- **Point**: 본문 전체가 아니라 핵심 숫자·키워드만 편집자가 직접 `<span class="hl">...</span>`로 감싸 부분 강조 (매 슬라이드 필수는 아님).
- **OWLSIGHT도 동일하게 적용** (2026-09-02 확정) — `templates-owlsight/Cover.dc.html`, `Point.dc.html`에 같은 `.hl` 클래스 존재, 사용법 동일.

## 인물 사진 우선 원칙 (2026-09-02 확정)

일반적인 배경/사물 사진보다 **식별 가능한 인물 사진이 시선을 더 끈다** — 특히 인물이 중심인 뉴스(연예·음악·패션 컬래버·가십 등)에서는 인물 사진을 배경으로 적극 쓴다. 이전까지의 "초상권 우려로 인물 회피" 기본값을 완화한 것.

- **초상권**: 공인(연예인·공직자 등)이 뉴스 맥락에서 다뤄지는 한 문제없음 — 이미 AI(하정우), 스니커즈(제니) 사례에서 확인된 원칙.
- **저작권은 별개, 계속 엄격하게**: 소속사 공식 캠페인컷·유료 스톡의 인물 사진을 무단으로 쓰면 안 됨. Wikimedia Commons 등 CC 라이선스가 명시된 사진만 사용하고, 깨끗한 라이선스 사진을 못 찾으면 인물 없는 대체 이미지로 폴백 — "얼굴이 있으면 좋다"가 "라이선스 없어도 된다"는 뜻은 아님.
- 진행 중인 법적 분쟁(고소·소송 등)을 다루는 가십성 아이템은 인물 사진 여부와 별개로 "확정된 사실"처럼 서술하지 않도록 톤에 주의.

## 사진·크레딧 규칙

- 배경 사진은 `tools/fetch_bg_image.py --query "..." --out assets/xxx.jpg --width 1080 --height 1350 --max-kb 70` 로 생성 (API 키 불필요).
- **소스 선택 (`--source`, 기본값 `openverse`)** — 아래 우선순위로 고른다:
  1. `unsplash` — 무드/일상/업무/추상적 개념 사진 (예: "빈 책상", "손으로 쓰는 모습"). 적중률이 가장 높아 기본으로 먼저 시도. 무료 Access Key 필요, `.env` 파일에 `UNSPLASH_ACCESS_KEY=...`로 저장돼 있음 (git에는 올라가지 않음).
  2. `wikimedia` — 실존 인물·건물·랜드마크 등 "구체적인 대상"이 필요할 때 (예: `--source wikimedia --query "Sagrada Familia"`).
  3. `nasa` — 우주·과학 주제 전용, NASA 제작물은 전부 퍼블릭 도메인이라 라이선스 고민도 없음.
  4. `openverse` (기본값) — 위 세 곳에서 안 나올 때 넓게 훑어보는 최후 수단. Flickr 등을 모은 범용 소스라 커버리지는 넓지만 적중률은 상대적으로 낮음.
- 스크립트 출력의 `creator` / `provider` / `license` 값을 그대로 `__PHOTO_CREDIT__`에 반영 — CC BY 계열은 크레딧 표기가 라이선스 조건이라 생략 금지. NASA는 퍼블릭 도메인이라 크레딧이 필수는 아니지만 관례상 표기한다.
- **모든 카드가 배경 사진을 쓴다** (2026-08-31 확정) — Cover/Stat/Closing뿐 아니라 Point 슬라이드도 배경 이미지를 기본으로 넣는다. Point는 라이트 배경이라 오버레이도 밝은 톤(`rgba(244,243,241,...)` 그라데이션)을 써서 가독성을 유지한다.
- **그래도 못 찾으면 사진 없이 간다** — 억지로 애매한 이미지를 쓰지 말고, 그 슬라이드만 플랫 배경(브랜드 컬러+타이포)으로 대체한다. 예외이지 기본값은 아니다.

## 이미지 교체 (자동 소싱이 부적절할 때)

자동 검색한 이미지가 부적절한 경우 (경쟁 브랜드 로고 노출, 식별 가능한 인물, ND 라이선스 등) 대표님이 직접 구한 합법적 이미지(기업 로고, 직접 찍은 거리 사진 등)로 바꿔 넣는다.

```
python tools/replace_image.py --dir runs/<날짜>-<주제> --slot point4 \
  --image "C:\경로\내가-구한-사진.jpg" --credit "무신사 제공"
```

- `--slot` — `cover` / `point1`~`point6` / `stat` / `closing` 중 하나.
- `--credit "..."` — `PHOTO — ...` 줄을 이 텍스트로 교체. 저작권 표시가 필요 없는 자체 소유 이미지라면 `--credit` 대신 `--no-credit`을 써서 크레딧 줄 자체를 지운다.
- `--fit cover`(기본값) — 다른 슬라이드와 동일하게 프레임을 꽉 채우고 넘치는 부분은 잘라낸다. 일반 사진에 적합.
- `--fit contain` — 잘리면 안 되는 이미지(로고 등)를 위해 자르지 않고 여백을 채워 넣는다. 여백 색은 슬라이드 배경에 맞춰 자동 선택되며 `--pad-color #RRGGBB`로 직접 지정할 수도 있다.

실행하면 `assets/<slot>-bg.jpg`를 교체하고 해당 `.dc.html`의 크레딧 줄을 갱신한다. 그 다음 항상 이어서:

1. `seed-canvas.mjs`로 캔버스 재생성
2. `Artifact` 같은 URL로 재게시
3. `tools/export_cardnews.mjs --dir runs/<날짜>-<주제>`로 `output/`의 PNG·캡션 갱신

## 새 세트 만드는 순서

채널이 cosmos.면 `templates/` + `runs/`+`output/`, OWLSIGHT면 `templates-owlsight/` + `runs-owlsight/`+`output-owlsight/`를 쓴다. 아래는 cosmos. 기준 예시이며 OWLSIGHT도 폴더명만 바꿔 그대로 따른다.

1. 그날 아이템으로 슬라이드 개수(N) 결정 — Cover 1 + Point N + Stat 0~1 + Closing 1.
2. `runs/<날짜>-<주제>/` 폴더 생성, 위 템플릿을 복사해 `Main.dc.html`(Cover), `Point1.dc.html`…`PointN.dc.html`, (필요시) `Stat.dc.html`, `Closing.dc.html`로 이름 지정 — **Main.dc.html은 항상 Cover여야 함** (seed-canvas.mjs가 첫 진입 아트보드로 인식). OWLSIGHT는 Cover/Point/Stat의 `__CATEGORY_TAG__` 토큰도 그 세트의 카테고리명으로 채운다.
3. `script.md`에 페이지별 원고 + 인스타 캡션을 함께 작성 (`- 캡션: ...` 한 줄, 문단 구분은 리터럴 `\n`) — 각 파일의 토큰을 이 내용으로 치환.
4. `tools/fetch_bg_image.py`로 모든 슬라이드(Cover/Point 전부/Stat/Closing)용 배경 이미지를 `assets/`에 생성 — Point 슬라이드도 예외 없이 이미지 필요 (위 "사진·크레딧 규칙" 참고).
5. `canvas.json`을 슬라이드 개수에 맞게 새로 작성 (아래 예시 참고).
6. `seed-canvas.mjs` → `--check` → `Artifact` 게시.
7. `node tools/export_cardnews.mjs --dir runs/<날짜>-<주제>` 실행 — 프로젝트 루트 바로 아래 `output/<날짜>-<주제>/`에 슬라이드 순서대로 `01.png`…`0N.png`와 `caption.txt`가 생성됨 (인스타 업로드용, `runs/` 안쪽이 아니라 depth 1로 바로 접근 가능). OWLSIGHT는 `runs-owlsight/`, `output-owlsight/`. 이 폴더가 최종 산출물 — MyBox로 동기화되니 여기서 바로 인스타그램 앱에 업로드하면 된다 (2026-09-02 확정: 리뷰 페이지·허브 페이지 기능 폐기, 더 이상 만들지 않음).

### canvas.json 예시 (Cover+Point×3+Stat+Closing = 6장)

```json
{
  "artboards": [
    { "file": "Main.dc.html", "x": 0, "y": 0, "w": 1080, "h": 1350 },
    { "file": "Point1.dc.html", "x": 1200, "y": 0, "w": 1080, "h": 1350 },
    { "file": "Point2.dc.html", "x": 2400, "y": 0, "w": 1080, "h": 1350 },
    { "file": "Point3.dc.html", "x": 3600, "y": 0, "w": 1080, "h": 1350 },
    { "file": "Stat.dc.html", "x": 4800, "y": 0, "w": 1080, "h": 1350 },
    { "file": "Closing.dc.html", "x": 6000, "y": 0, "w": 1080, "h": 1350 }
  ],
  "launch": { "view": "canvas" }
}
```
