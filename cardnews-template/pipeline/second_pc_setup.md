# 두 번째 작업 PC 설정 (집/사무실)

비용을 최소화하기 위한 운영 방식: **클라우드 루틴이나 API 과금 없이, Claude Pro/Max 구독 안에서 로컬 Claude Code 세션으로 작업**합니다. 집 PC든 사무실 PC든 이 저장소만 클론받으면 이어서 작업할 수 있습니다.

## 최초 1회 설정

1. **Git 설치 확인** (없으면 [git-scm.com](https://git-scm.com)에서 설치)

2. **저장소 클론**
   ```bash
   git clone https://github.com/kim4zang-rgb/cosmos-cardnews.git
   cd cosmos-cardnews
   ```

3. **Node.js 설치** (Design Component 캔버스를 만들 때 필요)
   ```powershell
   winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
   ```

4. **Python + Pillow 설치** (배경 이미지 검색·크롭 도구용)
   - Python이 없다면: `winget install --id Python.Python.3.13 -e`
   - Pillow 설치: `pip install Pillow`

5. **GitHub CLI 설치 + 로그인** (커밋을 push하려면 필요)
   ```powershell
   winget install --id GitHub.cli -e --source winget --accept-package-agreements --accept-source-agreements
   ```
   설치 후 새 터미널에서:
   ```powershell
   & "C:\Program Files\GitHub CLI\gh.exe" auth login
   ```
   (GitHub.com → HTTPS → 브라우저로 로그인, 순서대로 선택)

6. **설치 확인**
   ```bash
   node --version
   python --version
   git --version
   ```
   전부 버전이 출력되면 준비 완료.

## 작업할 때마다 (습관화)

- **시작 전**: `git pull` — 다른 PC에서 작업한 최신 내용 받아오기
- **끝나고**: `git add -A && git commit -m "설명"` → `git push` — 이 PC에서 만든 내용 올려두기

이 습관만 지키면 어느 PC에서 작업을 재개하든 항상 최신 상태로 이어집니다.

## 매일 아침 트렌드 스캔은 어떻게?

지금은 **수동으로** 그날 켜져 있는 PC에서 Claude Code를 열고 "오늘 아이템 스캔해줘" 라고 요청하는 방식을 권장합니다. Windows 작업 스케줄러로 완전 자동화하는 것도 가능하지만, `claude` CLI의 정확한 비대화형 실행 명령은 실제 터미널에서 `claude --help`로 확인한 뒤에 설정하는 게 안전합니다 (확인되면 이 문서에 추가하겠습니다).
