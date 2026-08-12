# MetroSeat

MetroSeat는 React, Vite, Vinext 기반의 지하철 좌석 점유 모니터링 데모입니다.

## 주요 기능

- 1호선부터 9호선까지 호선 선택
- 실시간 좌석 점유 시뮬레이션
- 호선별 색상 테마 반영
- 차량 선택 및 최근 센서 이벤트 표시
- Cloudflare/Vinext 배포 준비 완료

## 요구 사항

- Node.js 22.13.0 이상
- npm 또는 pnpm 설치

## 설치 방법

```bash
cd /Users/rankerblond/Desktop/ProJect/MetroSeat
npm install
```

## 로컬 실행

```bash
npm run dev
```

브라우저에서 실행 후, 모바일에서 접속하려면 PC의 LAN IP와 포트 `3000`을 사용하세요.

### 예시

예를 들어 PC에서 로컬 서버를 실행하면:

```bash
npm run dev
```

콘솔에 표시된 주소가 보통 `http://0.0.0.0:3000` 또는 `http://localhost:3000`입니다.

모바일에서 접속할 때는 다음 형식으로 입력하세요:

```text
http://<PC-LAN-IP>:3000
```

예: `http://192.168.0.15:3000`

> 참고: PC와 모바일은 같은 Wi-Fi 네트워크에 연결되어 있어야 합니다.

## 모바일 접속 방법

1. PC에서 `npm run dev` 실행
2. PC의 LAN IP 주소 확인
   - macOS: `ifconfig | grep inet`
   - Windows: `ipconfig`
3. 모바일 브라우저에서 `http://<PC-LAN-IP>:3000` 입력
4. MetroSeat 대시보드가 열리면 성공

## 배포 안내

이 프로젝트는 Vinext와 Cloudflare 환경을 지원하도록 설정되어 있습니다.

- `vite.config.ts`에서 `server.host = "0.0.0.0"` 및 `port = 3000`으로 설정되어 있습니다.
- `.hosting/hosting.json`에 배포 관련 메타데이터가 들어 있습니다.

배포 예시:

```bash
npm run build
npm run start
```

Cloudflare Wrangler를 사용하는 경우에는 프로젝트 설정과 인증이 필요합니다.

## 빌드

```bash
npm run build
```

## GitHub

원격 저장소: `https://github.com/rankerblond/MetroSeat.git`

## 참고

- `vite.config.ts`는 이미 `0.0.0.0` 바인딩과 포트 `3000`으로 설정되어 있습니다.
- Cloudflare/Vinext 배포 메타데이터는 `.hosting/hosting.json`에 포함되어 있습니다.
