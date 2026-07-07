# 오늘의 두뇌 운동 — 배포 가이드

## 1. 폴더 구성
```
index.html          ← 게임 본체 (이 파일 하나로 전체 작동)
assets/cards/        ← 기본으로 넣어둘 캐릭터 카드 이미지 폴더
README.md           ← 이 안내문
```

## 2. GitHub Pages로 배포하기

1. github.com에서 새 저장소(Repository)를 만듭니다. (Public으로 설정)
2. 이 폴더 안의 파일들(index.html, assets 폴더, README.md)을 저장소에 그대로 업로드합니다.
   - GitHub 웹사이트에서 저장소 페이지 → "Add file" → "Upload files"로 드래그앤드롭하면 됩니다.
3. 저장소 상단 메뉴 Settings → 왼쪽 메뉴 Pages로 들어갑니다.
4. Source를 "Deploy from a branch"로, Branch를 "main" / "/ (root)"로 선택 후 Save를 누릅니다.
5. 1~2분 뒤 `https://[내아이디].github.io/[저장소이름]/` 주소로 접속할 수 있습니다.
6. 이 주소를 부모님 폰에 링크로 보내드리면 됩니다. 홈 화면에 추가해두면 앱처럼 아이콘으로 쓸 수 있습니다.

## 3. 기본 카드(에셋 폴더) 등록하는 법

캐릭터 이미지 파일을 준비하신 뒤:

1. 이미지 파일을 `assets/cards/` 폴더 안에 넣습니다. (예: `assets/cards/pikachu.png`)
2. `index.html`을 열어 `DEFAULT_CARDS` 배열을 찾습니다. (파일 상단 스크립트 부분, `// 에셋 폴더 기본 카드` 라고 주석이 달려 있습니다)
3. 아래처럼 한 줄씩 추가합니다.

```js
const DEFAULT_CARDS = [
  { id:'default_pikachu', name:'피카츄', file:'assets/cards/pikachu.png' },
  { id:'default_naruto',  name:'나루토', file:'assets/cards/naruto.png' },
];
```

- `id`는 반드시 `default_`로 시작해야 합니다. (관리자 페이지에서 삭제 버튼이 안 뜨고 "기본" 표시가 붙습니다)
- `file`은 `assets/cards/` 안의 실제 파일 경로입니다.
- 다 넣으신 뒤 index.html을 다시 GitHub에 업로드(커밋)하시면 반영됩니다.

이 방식으로 넣은 카드는 base64 변환 없이 파일 그대로 로딩되기 때문에 브라우저 저장 용량(localStorage)을 전혀 쓰지 않습니다. 몇 장을 넣든 부담이 없습니다.

## 4. 관리자 페이지에서 나중에 추가하는 카드

배포 후에도 관리자 페이지(하단 "관리자 페이지" → 비밀번호 1128)에서 드래그앤드롭으로 카드를 계속 추가할 수 있습니다. 이렇게 추가한 카드는 그 기기의 브라우저(localStorage)에 저장되며, 장당 1.5MB 이하를 권장합니다. 여러 기기에서 똑같이 보이게 하려면 3번처럼 에셋 폴더에 파일로 넣는 방법을 쓰시는 게 안전합니다.

## 5. 데이터가 초기화되지 않는지 궁금하실 때

이 배포 방식은 회원 정보·카드 수집 현황을 브라우저의 localStorage에 저장합니다. index.html이나 assets 폴더 내용을 나중에 업데이트해도, 주소(URL)가 그대로면 기존에 모은 데이터는 사라지지 않습니다. 저장 키 이름(`bg:member:`, `bg:cards:index` 등)을 코드에서 바꾸지 않는 한 안전합니다.
