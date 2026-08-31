# cosmos. 카드뉴스 슬라이드 템플릿

매일 새 주제로 카드뉴스를 만들 때, 이 폴더의 4개 템플릿을 복사해서 `__TOKEN__` 표시만 실제 내용으로 바꿔 넣는다. `{{ }}` 형식은 Design Components 자체 문법과 겹치므로 절대 쓰지 않고, `__TOKEN__` (더블 언더스코어) 형식만 사용한다.

## 슬라이드 구성 규칙

- **Cover.dc.html** — 항상 1장, 캐러셀 맨 앞. 다크 배경 + 사진.
- **Point.dc.html** — 필요한 개수만큼 복제 (보통 2~4장). 라이트 배경, 사진 없음.
- **Stat.dc.html** — 0~1장. 강조할 숫자/통계가 있을 때만 사용. 다크 배경 + 사진.
- **Closing.dc.html** — 항상 1장, 캐러셀 맨 끝. 다크 배경 + 사진.

즉 한 세트는 `Cover(1) + Point(N) + Stat(0~1) + Closing(1)` = 총 3~7장 정도로 아이템에 따라 유동적이다.

## 각 템플릿의 토큰

| 파일 | 토큰 | 설명 |
|---|---|---|
| Cover.dc.html | `__COVER_BG__` | 배경 이미지 파일명 (예: `cover-bg.jpg`) |
| | `__HEADLINE__` | 훅 헤드라인. 줄바꿈은 `<br>` 직접 삽입, 한 줄에 6~9음절 정도로 짧게 |
| | `__SUBCOPY__` | 헤드라인 아래 한 줄 부연 설명 |
| | `__PHOTO_CREDIT__` | `이름 / 출처, 라이선스` 형식 (예: `Jonathan Combe / Flickr, CC BY 2.0`) |
| Point.dc.html | `__HEADLINE__` | 이 포인트의 핵심 한 문장 |
| | `__BODY__` | 설명 본문 (2~4줄 분량) |
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

## 사진·크레딧 규칙

- 배경 사진은 `tools/fetch_bg_image.py --query "..." --out assets/xxx.jpg --width 1080 --height 1350 --max-kb 70` 로 생성 (API 키 불필요).
- **소스 선택 (`--source`, 기본값 `openverse`)** — 아래 우선순위로 고른다:
  1. `unsplash` — 무드/일상/업무/추상적 개념 사진 (예: "빈 책상", "손으로 쓰는 모습"). 적중률이 가장 높아 기본으로 먼저 시도. 무료 Access Key 필요, `.env` 파일에 `UNSPLASH_ACCESS_KEY=...`로 저장돼 있음 (git에는 올라가지 않음).
  2. `wikimedia` — 실존 인물·건물·랜드마크 등 "구체적인 대상"이 필요할 때 (예: `--source wikimedia --query "Sagrada Familia"`).
  3. `nasa` — 우주·과학 주제 전용, NASA 제작물은 전부 퍼블릭 도메인이라 라이선스 고민도 없음.
  4. `openverse` (기본값) — 위 세 곳에서 안 나올 때 넓게 훑어보는 최후 수단. Flickr 등을 모은 범용 소스라 커버리지는 넓지만 적중률은 상대적으로 낮음.
- 스크립트 출력의 `creator` / `provider` / `license` 값을 그대로 `__PHOTO_CREDIT__`에 반영 — CC BY 계열은 크레딧 표기가 라이선스 조건이라 생략 금지. NASA는 퍼블릭 도메인이라 크레딧이 필수는 아니지만 관례상 표기한다.
- **여전히 못 찾으면 사진 없이 간다** — 억지로 애매한 이미지를 쓰지 말고, Point 슬라이드처럼 플랫 배경(브랜드 컬러+타이포)으로 대체하는 걸 기본값으로 삼는다.
- Point 슬라이드는 원칙적으로 사진을 넣지 않는다 (읽기용 텍스트 슬라이드는 플랫 배경 유지 — 가독성 + 브랜드의 절제된 톤 유지).

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

1. 그날 아이템으로 슬라이드 개수(N) 결정 — Cover 1 + Point N + Stat 0~1 + Closing 1.
2. `runs/<날짜>-<주제>/` 폴더 생성, 위 템플릿을 복사해 `Main.dc.html`(Cover), `Point1.dc.html`…`PointN.dc.html`, (필요시) `Stat.dc.html`, `Closing.dc.html`로 이름 지정 — **Main.dc.html은 항상 Cover여야 함** (seed-canvas.mjs가 첫 진입 아트보드로 인식).
3. `script.md`에 페이지별 원고 + 인스타 캡션을 함께 작성 (`- 캡션: ...` 한 줄, 문단 구분은 리터럴 `\n`) — 각 파일의 토큰을 이 내용으로 치환.
4. `tools/fetch_bg_image.py`로 모든 슬라이드(Cover/Point 전부/Stat/Closing)용 배경 이미지를 `assets/`에 생성 — Point 슬라이드도 예외 없이 이미지 필요 (위 "사진·크레딧 규칙" 참고).
5. `canvas.json`을 슬라이드 개수에 맞게 새로 작성 (아래 예시 참고).
6. `seed-canvas.mjs` → `--check` → `Artifact` 게시.
7. `node tools/export_cardnews.mjs --dir runs/<날짜>-<주제>` 실행 — 프로젝트 루트 바로 아래 `output/<날짜>-<주제>/`에 슬라이드 순서대로 `01.png`…`0N.png`와 `caption.txt`가 생성됨 (인스타 업로드용, `runs/` 안쪽이 아니라 depth 1로 바로 접근 가능).

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
