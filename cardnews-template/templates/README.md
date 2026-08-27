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

- 배경 사진은 `tools/fetch_bg_image.py --query "..." --out assets/xxx.jpg --width 1080 --height 1350 --max-kb 70` 로 생성 (Openverse, CC 라이선스, API 키 불필요).
- 스크립트 출력의 `creator` / `provider` / `license` 값을 그대로 `__PHOTO_CREDIT__`에 반영 — CC BY 계열은 크레딧 표기가 라이선스 조건이라 생략 금지.
- Point 슬라이드는 사진을 넣지 않는다 (읽기용 텍스트 슬라이드는 플랫 배경 유지 — 가독성 + 브랜드의 절제된 톤 유지).

## 새 세트 만드는 순서

1. 그날 아이템으로 슬라이드 개수(N) 결정 — Cover 1 + Point N + Stat 0~1 + Closing 1.
2. `runs/<날짜>/` 폴더 생성, 위 템플릿을 복사해 `Main.dc.html`(Cover), `Point1.dc.html`…`PointN.dc.html`, (필요시) `Stat.dc.html`, `Closing.dc.html`로 이름 지정 — **Main.dc.html은 항상 Cover여야 함** (seed-canvas.mjs가 첫 진입 아트보드로 인식).
3. 각 파일의 토큰을 그날 스크립트 내용으로 치환.
4. `tools/fetch_bg_image.py`로 Cover/Stat/Closing용 이미지 3장(또는 Stat 생략 시 2장) 생성.
5. `canvas.json`을 슬라이드 개수에 맞게 새로 작성 (아래 예시 참고).
6. `seed-canvas.mjs` → `--check` → `Artifact` 게시.

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
