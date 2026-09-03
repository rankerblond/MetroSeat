# MetroSeat 개발 진행 기록

> 기준일: 2026-09-03  
> 저장소: `rankerblond/MetroSeat`

이 문서는 MetroSeat 프로젝트에서 실제로 진행한 GitHub 이슈 정리, 코드 구현, API/DB 구조, UI 리팩터링, 테스트 및 배포 준비 과정을 한 곳에 기록합니다.

---

## 1. 프로젝트 목표

MetroSeat는 지하철 좌석에 설치된 무게/압력 센서 데이터를 이용해 좌석 점유 상태를 실시간으로 보여주는 좌석 모니터링 시스템입니다.

현재 MVP의 핵심 흐름은 다음과 같습니다.

```text
좌석 센서
  ↓
ESP32 / 차량 게이트웨이
  ↓
POST /api/sensors
  ↓
센서 검증 + 좌석 매핑
  ↓
Cloudflare D1
  ├─ sensor_events : 센서 이벤트 이력
  └─ seat_states   : 좌석별 최신 상태
  ↓
GET /api/seats
  ↓
MetroSeat Dashboard
  ↓
차량별 혼잡도 / 빈 좌석 / 추천 차량 표시
```

---

## 2. GitHub 작업 관리

초기에는 Issues가 없는 상태였기 때문에 개발 작업을 기능 단위로 분리했습니다.

### 생성한 Issues

| # | 우선순위 | 영역 | 작업 | 상태 |
|---|---|---|---|---|
| #1 | P0 | Sensor | 실제 무게센서 데이터 수신 구조 구현 | PR #11에서 구현 |
| #2 | P0 | Core | 센서 ID ↔ 차량/좌석 매핑 규칙 설계 | PR #11에서 구현 |
| #3 | P0 | API | 실시간 좌석 상태 API 구현 | PR #11에서 구현 |
| #4 | P1 | DB | D1 + Drizzle 좌석 이벤트 저장 구조 구현 | PR #12에서 구현 |
| #5 | P1 | UI | 센서 연결 상태 및 마지막 수신시간 표시 | PR #12에서 구현 |
| #6 | P1 | UI | 차량별 혼잡도 비교 및 최적 차량 추천 강화 | PR #12에서 구현 |
| #7 | P1 | Data | 1~9호선 역/환승 데이터 정합성 정리 | 부분 진행 |
| #8 | P1 | Refactor | page.tsx 역할 분리 및 컴포넌트 구조 정리 | PR #12에서 구현 |
| #9 | P2 | Deploy | Cloudflare 배포 및 프로덕션 환경 검증 | 배포 준비/CI 진행 |
| #10 | P2 | Test | 좌석 점유 판정 및 혼잡도 계산 테스트 추가 | PR #12에서 구현 |

모든 이슈는 `목표 / 작업 체크리스트 / 완료 조건` 형식으로 작성했습니다.

---

## 3. Phase 1 — 센서 API Core

### PR #11

브랜치:

```text
feat/sensor-api-core
```

PR 제목:

```text
feat: sensor ingest and seat state API core
```

PR #11은 main 브랜치에 병합했습니다.

### 구현 내용

#### 3.1 SensorEvent 타입

센서가 서버로 보내는 기본 데이터 형식을 정의했습니다.

```json
{
  "sensorId": "CAR-1-SEAT-01",
  "weight": 62.4,
  "timestamp": "2026-09-03T05:30:00.000Z"
}
```

핵심 필드:

- `sensorId`: 실제 물리 센서 식별자
- `weight`: 감지 무게
- `timestamp`: 측정 시각

#### 3.2 센서 ↔ 좌석 매핑

센서 ID를 MetroSeat 내부의 다음 정보로 변환하는 구조를 추가했습니다.

```text
sensorId
  ↓
carNumber
seatIndex
seatId
```

이를 통해 물리 센서가 어느 차량의 어느 좌석인지 결정할 수 있습니다.

#### 3.3 센서 데이터 검증

다음 입력을 검증합니다.

- 등록되지 않은 센서 ID
- 음수 무게
- 300kg 초과 값
- 숫자가 아닌 무게
- 잘못된 timestamp

착석 판정 기본 임계값은 `18kg`입니다.

```text
weight >= 18kg → occupied
weight < 18kg  → empty
```

#### 3.4 센서 수신 API

```http
POST /api/sensors
```

요청 예시:

```json
{
  "sensorId": "CAR-1-SEAT-01",
  "weight": 55,
  "timestamp": "2026-09-03T05:30:00.000Z"
}
```

#### 3.5 좌석 상태 API

```http
GET /api/seats
GET /api/seats?car=1
```

차량 번호를 전달하면 해당 차량의 좌석 상태만 조회할 수 있습니다.

Phase 1 시점에는 메모리 저장소를 사용했고, Phase 2에서 D1으로 교체했습니다.

---

## 4. Phase 2 — D1 데이터베이스

### PR #12

브랜치:

```text
feat/mvp-phase2
```

PR 제목:

```text
feat: persist sensors, connect dashboard, add CI and tests
```

### 4.1 Drizzle Schema

`db/schema.ts`에 두 개의 테이블을 추가했습니다.

#### sensor_events

센서가 전송한 이벤트 이력을 저장합니다.

주요 컬럼:

```text
id
sensor_id
car_number
seat_index
seat_id
weight
occupied
timestamp
created_at
```

용도:

- 센서 로그 확인
- 장애 추적
- 시간대별 좌석 사용 분석
- 향후 통계 데이터 생성

#### seat_states

각 좌석의 최신 상태만 유지합니다.

```text
seat_id (PK)
sensor_id
car_number
seat_index
weight
occupied
updated_at
```

새로운 센서 이벤트가 들어오면 해당 좌석은 `upsert` 방식으로 갱신됩니다.

### 4.2 Migration

추가한 migration:

```text
drizzle/0000_metroseat_sensor.sql
```

두 테이블과 센서 이벤트 조회용 인덱스를 생성합니다.

### 4.3 Repository 계층

추가 파일:

```text
lib/sensor/repository.ts
```

역할:

```text
persistSeatState()
listSeatStates()
listRecentSensorEvents()
```

API Route에서 직접 SQL을 작성하지 않고 데이터 접근 로직을 분리했습니다.

---

## 5. API 구조

현재 핵심 API는 세 종류입니다.

### 5.1 센서 입력

```http
POST /api/sensors
```

처리 과정:

```text
Request
 → payload validation
 → sensorId mapping
 → occupied 계산
 → sensor_events INSERT
 → seat_states UPSERT
 → response
```

### 5.2 현재 좌석 상태

```http
GET /api/seats
```

전체 차량 상태 조회.

```http
GET /api/seats?car=2
```

특정 차량 조회.

### 5.3 최근 센서 이벤트

```http
GET /api/sensor-events
GET /api/sensor-events?limit=20
```

최근 센서 입력 로그를 조회합니다.

최대 100개까지 요청할 수 있도록 제한했습니다.

---

## 6. Dashboard 개선

기존 `app/page.tsx`에는 다음 내용이 한 파일에 섞여 있었습니다.

```text
노선 데이터
좌석 생성
센서 시뮬레이터
혼잡도 계산
추천 차량 계산
UI
```

Phase 2에서 이 구조를 정리했습니다.

### 6.1 실센서 우선 + Simulation Fallback

Dashboard는 실행 중 다음 API를 polling합니다.

```http
GET /api/seats
```

기본 polling 주기:

```text
2.5초
```

D1에 실제 센서 데이터가 존재하면:

```text
SENSOR / D1 MODE
```

API 또는 D1을 사용할 수 없으면:

```text
SIMULATION MODE
```

로 자동 전환합니다.

따라서 개발 환경에서 Cloudflare D1이 없어도 화면 개발을 계속할 수 있습니다.

### 6.2 실제 센서 데이터 보호

Sensor 모드에서는 좌석을 클릭해 가짜 무게값으로 변경하지 못하게 했습니다.

Simulation 모드에서만 좌석 클릭을 통한 테스트가 가능합니다.

### 6.3 센서 연결 상태

최근 센서 수신시간으로 Gateway 상태를 계산합니다.

상태:

```text
waiting
connected
stale
error
```

기준:

```text
최근 10초 이내 센서 수신 → connected
10초 이상 미수신         → stale
수신 기록 없음           → waiting
잘못된 시간값             → error
```

Dashboard에 다음 정보가 표시됩니다.

- 센서 연결 여부
- D1 / Simulation 모드
- 마지막 센서 수신 시각
- 현재 API 상태

---

## 7. 차량 혼잡도 및 추천

계산 로직을 `lib/metro/metrics.ts`로 분리했습니다.

주요 함수:

```text
isOccupied()
summarizeCars()
chooseBestCar()
getGatewayStatus()
```

### 차량별 계산

차량마다 다음 정보를 계산합니다.

```text
occupied
empty
total
occupancyRate
```

### 추천 차량 알고리즘

우선순위:

1. 빈 좌석이 가장 많은 차량
2. 동률이면 점유율이 낮은 차량
3. 다시 동률이면 차량 번호가 낮은 차량

이를 Dashboard의 `추천 차량`에 표시합니다.

---

## 8. 노선 데이터 정리

기존 `page.tsx` 내부에는 1~9호선 역 데이터가 직접 들어 있었고 일부 노선에서 중복/잘못된 역이 섞여 있었습니다.

예를 들어 기존 데이터에는 다른 노선 역이 섞이거나 같은 역이 여러 번 반복되는 구간이 있었습니다.

따라서 노선 데이터를 다음 파일로 분리했습니다.

```text
lib/metro/lines.ts
```

현재는 Dashboard 기능 검증에 필요한 **대표 역 데이터셋**을 사용합니다.

중요:

이 데이터셋은 현재 `전체 서울 지하철 역 DB`를 의미하지 않습니다. 전체 역 순서, 지선, 환승 노선 코드 등을 공식 데이터와 완전히 맞추는 작업은 Issue #7의 후속 작업으로 남겨두었습니다.

---

## 9. 테스트

### 추가 테스트

```text
tests/metrics.test.mjs
```

테스트 항목:

#### 임계값 테스트

```text
18kg / threshold 18kg → occupied
17.9kg                → empty
```

#### 차량 혼잡도 계산

- occupied 계산
- empty 계산
- occupancyRate 계산

#### 추천 차량 선택

빈 좌석 수가 가장 많은 차량이 선택되는지 검증합니다.

#### Gateway 상태

- waiting
- connected
- stale
- invalid timestamp

케이스를 테스트합니다.

### 실행 명령

Unit test만 실행:

```bash
pnpm test:unit
```

전체 검증:

```bash
pnpm test
```

---

## 10. CI

추가 파일:

```text
.github/workflows/ci.yml
```

Pull Request 또는 main push 시 다음을 실행합니다.

```text
1. pnpm install --frozen-lockfile
2. pnpm test:unit
3. pnpm lint
4. pnpm build
```

이를 통해 main에 들어가기 전에 기본 품질 검증이 가능하도록 구성했습니다.

---

## 11. Cloudflare 배포 상태

프로젝트는 Vinext + Cloudflare 기반이며 D1 binding은 다음 이름을 기대합니다.

```text
DB
```

실제 공개 배포를 완료하려면 Cloudflare 계정에서 다음 작업이 필요합니다.

```text
1. D1 Database 생성
2. DB binding 연결
3. migration 적용
4. Cloudflare 인증/프로젝트 연결
5. production build
6. deploy
7. 공개 URL smoke test
```

현재 코드/CI/DB schema/API는 배포를 위한 구조까지 준비했습니다.

실제 Cloudflare 계정 인증과 배포 대상 프로젝트 설정은 저장소 코드만으로 대신할 수 없으므로 Issue #9에서 최종 배포 단계로 남겨둡니다.

---

## 12. 현재 파일 구조

핵심 구조는 다음과 같습니다.

```text
MetroSeat/
├─ .github/
│  └─ workflows/
│     └─ ci.yml
│
├─ app/
│  ├─ api/
│  │  ├─ seats/
│  │  │  └─ route.ts
│  │  ├─ sensor-events/
│  │  │  └─ route.ts
│  │  └─ sensors/
│  │     └─ route.ts
│  └─ page.tsx
│
├─ db/
│  ├─ index.ts
│  └─ schema.ts
│
├─ drizzle/
│  └─ 0000_metroseat_sensor.sql
│
├─ lib/
│  ├─ metro/
│  │  ├─ lines.ts
│  │  ├─ metrics.ts
│  │  └─ metrics.mjs
│  └─ sensor/
│     ├─ mapping.ts
│     ├─ repository.ts
│     ├─ store.ts
│     └─ types.ts
│
└─ tests/
   └─ metrics.test.mjs
```

---

## 13. 완료된 개발 흐름

```text
[완료] 작업 이슈 정의
   ↓
[완료] 센서 이벤트 타입
   ↓
[완료] 센서 ↔ 좌석 Mapping
   ↓
[완료] 센서 Validation
   ↓
[완료] Sensor API
   ↓
[완료] Seat API
   ↓
[완료] D1 Schema
   ↓
[완료] Sensor Event 저장
   ↓
[완료] Latest Seat State 저장
   ↓
[완료] Dashboard API polling
   ↓
[완료] Simulation fallback
   ↓
[완료] Gateway 상태
   ↓
[완료] 차량별 혼잡도
   ↓
[완료] 추천 차량
   ↓
[완료] Unit Test
   ↓
[완료] GitHub Actions CI
   ↓
[진행] 전체 노선 데이터 정합성
   ↓
[대기] 실제 Cloudflare 배포
   ↓
[대기] ESP32/실물 센서 연결
```

---

## 14. 다음 개발 우선순위

### P0 — 실제 하드웨어

```text
ESP32 → HTTP POST /api/sensors
```

실제 Load Cell + HX711 또는 선택한 무게센서에서 데이터를 읽어 서버로 보내는 Firmware가 필요합니다.

### P1 — 센서 Calibration

현재 기본 임계값은 `18kg`입니다.

실제 좌석에서는 다음 요소를 고려해야 합니다.

- 센서 영점값
- 좌석 자체 무게
- 진동
- 열차 가속/감속
- 센서 오차

따라서 단일 threshold보다 calibration + hysteresis 방식으로 발전시키는 것이 좋습니다.

### P1 — 전체 노선 DB

현재 대표 역 데이터셋을 다음과 같은 정규화 데이터로 교체할 수 있습니다.

```text
Line
Station
StationOrder
TransferLine
StationCode
```

### P1 — 실시간 통신

현재 Dashboard는 HTTP polling 방식입니다.

향후 센서 수가 증가하면 다음 구조를 검토할 수 있습니다.

```text
WebSocket
Server-Sent Events
MQTT → Gateway → API
```

### P2 — 운영 기능

- 센서 Offline 알림
- Gateway Health
- 센서 배터리/전압
- 차량별 장애 센서 수
- 이벤트 로그 Dashboard
- 관리자 Calibration 화면

---

## 15. Pull Request 기록

### PR #11

```text
feat: sensor ingest and seat state API core
```

주요 작업:

- Issue #1
- Issue #2
- Issue #3

결과:

```text
Merged → main
```

### PR #12

```text
feat: persist sensors, connect dashboard, add CI and tests
```

주요 작업:

- Issue #4
- Issue #5
- Issue #6
- Issue #8
- Issue #10
- Issue #7 일부
- Issue #9 일부

---

## 16. 현재 MVP 정의

현재 MetroSeat MVP가 목표로 하는 최소 동작은 다음과 같습니다.

```text
1. 센서가 좌석 무게를 측정한다.
2. 센서 ID와 좌석을 매핑한다.
3. 서버가 센서 이벤트를 검증한다.
4. D1에 센서 이벤트를 기록한다.
5. 좌석별 최신 상태를 저장한다.
6. Dashboard가 좌석 상태를 조회한다.
7. 빈 좌석/점유 좌석을 구분한다.
8. 차량별 혼잡도를 계산한다.
9. 가장 여유로운 차량을 추천한다.
10. 센서가 끊기면 Dashboard에서 상태를 확인할 수 있다.
```

이 상태에서 실제 ESP32/무게센서를 연결하면 소프트웨어 MVP와 하드웨어 MVP를 결합할 수 있습니다.
