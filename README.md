# MetroSeat

MetroSeat는 지하철 좌석의 무게/압력 센서 데이터를 이용해 차량별 좌석 점유 상태를 보여주는 실시간 모니터링 MVP입니다.

현재 구조는 **센서 입력 → API → Cloudflare D1 → Dashboard → 차량 추천** 흐름을 기준으로 개발하고 있습니다.

## 현재 구현 상태

- 1호선부터 9호선까지 노선 선택 UI
- 4개 차량 × 차량당 28좌석 데모
- 무게 임계값 기반 좌석 점유 판정
- 센서 ID ↔ 차량/좌석 매핑
- `POST /api/sensors` 센서 이벤트 수신
- Cloudflare D1 + Drizzle 센서 이벤트 저장
- `GET /api/seats` 좌석 최신 상태 조회
- `GET /api/sensor-events` 최근 센서 이벤트 조회
- Dashboard D1 polling
- D1 미연결 시 Simulation fallback
- 센서 연결/수신 지연 상태 표시
- 차량별 혼잡도 및 최적 차량 추천
- 핵심 계산 Unit Test
- GitHub Actions CI

## 개발 진행 문서

전체 작업 기록은 아래 문서에 정리되어 있습니다.

[`docs/DEVELOPMENT_PROGRESS.md`](docs/DEVELOPMENT_PROGRESS.md)

해당 문서에는 다음 내용이 포함됩니다.

- GitHub Issue #1 ~ #10
- PR #11 / PR #12
- Sensor API 설계
- D1 / Drizzle 구조
- Dashboard 구조
- 테스트
- CI
- Cloudflare 배포 준비
- 향후 ESP32/실물 센서 연결 계획

## 시스템 구조

```text
좌석 무게센서
   ↓
ESP32 / 차량 Gateway
   ↓
POST /api/sensors
   ↓
Sensor Validation + Seat Mapping
   ↓
Cloudflare D1
   ├─ sensor_events
   └─ seat_states
   ↓
GET /api/seats
   ↓
MetroSeat Dashboard
```

## 요구 사항

- Node.js `>=22.13.0`
- npm 또는 pnpm

## 설치

```bash
pnpm install
```

또는

```bash
npm install
```

## 개발 서버

```bash
pnpm dev
```

또는

```bash
npm run dev
```

## 테스트

Unit Test:

```bash
pnpm test:unit
```

전체 테스트:

```bash
pnpm test
```

## Lint

```bash
pnpm lint
```

## Build

```bash
pnpm build
```

## Database

Drizzle schema:

```text
db/schema.ts
```

Migration 생성:

```bash
pnpm db:generate
```

현재 MetroSeat에서 사용하는 주요 테이블:

```text
sensor_events
seat_states
```

## Sensor API

### 센서 이벤트 입력

```http
POST /api/sensors
```

예시:

```json
{
  "sensorId": "CAR-1-SEAT-01",
  "weight": 64.2,
  "timestamp": "2026-09-03T05:30:00.000Z"
}
```

### 좌석 상태 조회

```http
GET /api/seats
```

특정 차량:

```http
GET /api/seats?car=1
```

### 최근 센서 이벤트

```http
GET /api/sensor-events?limit=20
```

## Cloudflare 배포

프로젝트는 Vinext + Cloudflare 환경을 기준으로 구성되어 있습니다.

D1 binding 이름:

```text
DB
```

실제 배포 전에는 Cloudflare 프로젝트에서 D1 Database를 생성하고 `DB` binding을 연결해야 합니다.

자세한 배포 준비 단계는 [`docs/DEVELOPMENT_PROGRESS.md`](docs/DEVELOPMENT_PROGRESS.md)를 참고하세요.

## 현재 다음 우선순위

1. 실제 ESP32 + 무게센서 데이터 전송
2. 센서 calibration / hysteresis
3. 전체 지하철 노선 DB 정합성 검증
4. Cloudflare 실제 공개 배포
5. 센서 장애/Offline 관리 기능
