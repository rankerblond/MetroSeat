"use client";

import { useEffect, useMemo, useState } from "react";

type Seat = {
  id: string;
  row: "left" | "right";
  index: number;
  weight: number;
  updatedAt: string;
};

const CAR_COUNT = 4;
const SEATS_PER_CAR = 28;
const DEFAULT_THRESHOLD = 18;

type LineKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type LineConfig = {
  name: string;
  defaultStation: string;
  sections: { label: string; stations: string[] }[];
};

const lineConfigs: Record<LineKey, LineConfig> = {
  1: {
    name: "1호선",
    defaultStation: "서울역",
    sections: [
      {
        label: "경부선 주요역",
        stations: [
          "소요산",
          "동두천",
          "도봉산",
          "창동 (4호선)",
          "종로3가",
          "서울역",
          "시청",
          "용산",
          "영등포",
          "부천",
          "부평",
          "인천",
        ],
      },
      {
        label: "수원 방향 구간",
        stations: [
          "수원",
          "병점",
          "세류",
          "화서",
          "성균관대",
          "수원",
        ],
      },
      {
        label: "천안 방향 구간",
        stations: [
          "천안",
          "광명",
          "평택",
          "오송",
          "대전",
        ],
      },
    ],
  },
  2: {
    name: "2호선",
    defaultStation: "강남",
    sections: [
      {
        label: "강남 순환 구간",
        stations: [
          "성수",
          "건대입구",
          "구의",
          "강변",
          "잠실",
          "잠실새내",
          "종합운동장",
          "삼성",
          "선릉",
          "역삼",
          "강남",
          "교대",
          "서초",
          "방배",
          "사당",
        ],
      },
      {
        label: "시청 순환 구간",
        stations: [
          "신림",
          "신대방",
          "구로디지털단지",
          "대림",
          "영등포구청",
          "당산",
          "합정",
          "홍대입구",
          "신촌",
          "이대",
          "시청",
        ],
      },
    ],
  },
  3: {
    name: "3호선",
    defaultStation: "고속터미널",
    sections: [
      {
        label: "대화-구파발 구간",
        stations: [
          "대화",
          "주엽",
          "정발산",
          "백석",
          "불광",
          "구파발",
          "지축",
          "삼송",
          "원흥",
          "대곡",
          "화정",
        ],
      },
      {
        label: "을지로-압구정 구간",
        stations: [
          "경복궁",
          "안국",
          "종로3가",
          "을지로3가",
          "충무로",
          "약수",
          "금호",
          "옥수",
          "압구정",
          "신사",
          "고속터미널",
        ],
      },
    ],
  },
  4: {
    name: "4호선",
    defaultStation: "한성대입구",
    sections: [
      {
        label: "진접선 구간 (남양주)",
        stations: ["진접", "오남", "별내별가람"],
      },
      {
        label: "서울 지하철 4호선 구간 (서울)",
        stations: [
          "불암산 (구 당고개)",
          "상계",
          "노원 (7호선)",
          "창동 (1호선)",
          "쌍문",
          "수유",
          "미아",
          "미아사거리",
          "길음",
          "성신여대입구 (우이신설선)",
          "한성대입구",
          "혜화",
          "동대문 (1호선)",
          "동대문역사문화공원 (2호선, 5호선)",
          "충무로 (3호선)",
          "명동",
          "회현",
          "서울역 (1호선, 경의중앙선, 공항철도, KTX/SRT)",
          "숙대입구",
          "삼각지 (6호선)",
          "신용산",
          "이촌 (경의중앙선)",
          "동작 (9호선)",
          "총신대입구(이수) (7호선)",
          "사당 (2호선)",
          "남태령",
        ],
      },
      {
        label: "과천선 구간 (과천 · 안양)",
        stations: [
          "선바위",
          "경마공원",
          "대공원",
          "과천",
          "정부과천청사",
          "인덕원",
          "평촌",
          "범계",
          "금정 (1호선)",
        ],
      },
      {
        label: "안산선 구간 (군포 · 안산 · 시흥)",
        stations: [
          "산본",
          "수리산",
          "반월",
          "상록수",
          "한대앞",
          "중앙",
          "고잔",
          "초지",
          "안산",
          "신길온천",
          "정왕",
          "오이도",
        ],
      },
    ],
  },
  5: {
    name: "5호선",
    defaultStation: "군자",
    sections: [
      {
        label: "상일동-방화 구간",
        stations: [
          "방화",
          "마곡",
          "김포공항",
          "마곡나루",
          "발산",
          "우장산",
          "화곡",
          "까치산",
          "신정",
          "목동",
          "오목교",
          "양평",
          "영등포구청",
          "신길",
          "여의도",
          "마포",
          "서강대",
          "대흥",
          "공덕",
          "애오개",
          "충정로",
          "서대문",
          "광화문",
          "종로3가",
          "을지로4가",
          "동대문역사문화공원",
          "청량리",
          "행당",
          "왕십리",
          "마장",
          "답십리",
          "장한평",
          "군자",
          "아차산",
          "광나루",
          "천호",
          "강동",
          "길동",
          "굽은다리",
          "명일",
          "고덕",
          "상일동",
        ],
      },
    ],
  },
  6: {
    name: "6호선",
    defaultStation: "삼각지",
    sections: [
      {
        label: "답십리-봉화산 구간",
        stations: [
          "응암",
          "역촌",
          "불광",
          "독바위",
          "연신내",
          "구산",
          "응암",
          "새절",
          "증산",
          "디지털미디어시티",
          "월드컵경기장",
          "마포구청",
          "망원",
          "합정",
          "상수",
          "광흥창",
          "대흥",
          "공덕",
          "효창공원앞",
          "삼각지",
          "녹사평",
          "삼성동",
          "봉은사",
          "청담",
          "학여울",
          "대치",
          "도곡",
          "구룡",
          "개포동",
          "대모산입구",
          "서울대입구",
          "낙성대",
          "사당",
          "방배",
          "이촌",
          "공덕",
          "충정로",
          "동대문역사문화공원",
          "청량리",
          "버티고개",
          "약수",
          "녹사평",
          "한강진",
          "버티고개",
          "약수",
          "청구",
        ],
      },
    ],
  },
  7: {
    name: "7호선",
    defaultStation: "건대입구",
    sections: [
      {
        label: "장암-부평구청 구간",
        stations: [
          "장암",
          "도봉산",
          "수락산",
          "마들",
          "노원",
          "중계",
          "하계",
          "공릉",
          "태릉입구",
          "먹골",
          "중화",
          "상봉",
          "면목",
          "사가정",
          "용마산",
          "중곡",
          "군자",
          "강변",
          "천호",
          "길동",
          "굽은다리",
          "명일",
          "고덕",
          "상일동",
          "둔촌동",
          "암사",
          "천왕",
          "온수",
          "영등포구청",
          "부평구청",
        ],
      },
    ],
  },
  8: {
    name: "8호선",
    defaultStation: "잠실",
    sections: [
      {
        label: "암사-모란 구간",
        stations: [
          "암사",
          "천호",
          "강동구청",
          "몽촌토성",
          "석촌",
          "송파",
          "잠실",
          "잠실새내",
          "종합운동장",
          "삼전",
          "석촌고분",
          "석촌",
          "가락시장",
          "문정",
          "장지",
          "산성",
          "복정",
          "남한산성입구",
          "단대오거리",
          "신흥",
          "수진",
          "모란",
        ],
      },
    ],
  },
  9: {
    name: "9호선",
    defaultStation: "신논현",
    sections: [
      {
        label: "개화-중앙보훈병원 구간",
        stations: [
          "개화",
          "김포공항",
          "공항시장",
          "신방화",
          "마곡나루",
          "양천향교",
          "가양",
          "증미",
          "등촌",
          "염창",
          "신목동",
          "선유도",
          "당산",
          "국회의사당",
          "여의도",
          "샛강",
          "노량진",
          "노들",
          "흑석",
          "동작",
          "구반포",
          "신반포",
          "고속터미널",
          "교대",
          "신논현",
          "언주",
          "선정릉",
          "삼성중앙",
          "봉은사",
          "종합운동장",
          "삼성",
          "신논현",
          "선정릉",
          "삼성중앙",
          "봉은사",
          "종합운동장",
          "삼성",
          "중앙보훈병원",
        ],
      },
    ],
  },
};

const nowTime = () =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

const buildSeats = (carNumber: number): Seat[] => 
  Array.from({ length: SEATS_PER_CAR }, (_, seatIndex) => {
    const occupied = (seatIndex + carNumber) % 4 !== 0;
    return {
      id: `${carNumber}-${String(seatIndex + 1).padStart(2, "0")}`,
      row: seatIndex < SEATS_PER_CAR / 2 ? "left" : "right",
      index: seatIndex + 1,
      weight: occupied ? 43 + ((seatIndex * 7 + carNumber) % 34) : (seatIndex * 3) % 9,
      updatedAt: nowTime(),
    };
  });

const initialTrain = () =>
  Array.from({ length: CAR_COUNT }, (_, carIndex) => ({
    carNumber: carIndex + 1,
    seats: buildSeats(carIndex + 1),
  }));

export default function Home() {
  const [train, setTrain] = useState(initialTrain);
  const [selectedLine, setSelectedLine] = useState<LineKey>(4);
  const selectedLineConfig = lineConfigs[selectedLine];
  const [selectedCar, setSelectedCar] = useState(1);
  const [selectedStation, setSelectedStation] = useState(selectedLineConfig.defaultStation);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [isLive, setIsLive] = useState(true);
  const [lastSensor, setLastSensor] = useState("게이트웨이 연결 대기");
  const [currentTime, setCurrentTime] = useState("");

  const routeSections = selectedLineConfig.sections;
  const routeStations = routeSections.flatMap((section) => section.stations);

  useEffect(() => {
    setSelectedStation(selectedLineConfig.defaultStation);
  }, [selectedLine, selectedLineConfig.defaultStation]);

  const selectedStationIndex = routeStations.indexOf(selectedStation);
  const previousStation =
    selectedStationIndex > 0 ? routeStations[selectedStationIndex - 1] : "없음";
  const nextStation =
    selectedStationIndex < routeStations.length - 1
      ? routeStations[selectedStationIndex + 1]
      : "없음";

  useEffect(() => {
    setCurrentTime(nowTime());
    const clock = window.setInterval(() => setCurrentTime(nowTime()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!isLive) return;

    const interval = window.setInterval(() => {
      setTrain((currentTrain) => {
        const carIndex = Math.floor(Math.random() * currentTrain.length);
        const seatIndex = Math.floor(Math.random() * SEATS_PER_CAR);
        const nextTrain = currentTrain.map((car) => ({
          ...car,
          seats: car.seats.map((seat) => ({ ...seat })),
        }));
        const seat = nextTrain[carIndex].seats[seatIndex];
        const shouldOccupy =
          seat.weight >= threshold ? Math.random() > 0.22 : Math.random() > 0.48;

        seat.weight = shouldOccupy
          ? Math.round(38 + Math.random() * 42)
          : Math.round(Math.random() * Math.max(6, threshold - 6));
        seat.updatedAt = nowTime();

        setLastSensor(
          `${nextTrain[carIndex].carNumber}호차 ${seat.id}번 좌석 ${seat.weight}kg 감지`,
        );

        return nextTrain;
      });
    }, 1500);

    return () => window.clearInterval(interval);
  }, [isLive, threshold]);

  const car = train[selectedCar - 1] ?? train[0] ?? { carNumber: 1, seats: [] };

  const trainSummary = useMemo(() => {
    const totalSeats = train.length * SEATS_PER_CAR;
    const occupiedSeats = train.reduce(
      (sum, currentCar) =>
        sum + currentCar.seats.filter((seat) => seat.weight >= threshold).length,
      0,
    );
    const vacancy = totalSeats - occupiedSeats;
    const bestCar = train.length
      ? train
          .map((currentCar) => ({
            carNumber: currentCar.carNumber,
            emptySeats: currentCar.seats.filter((seat) => seat.weight < threshold).length,
          }))
          .sort((a, b) => b.emptySeats - a.emptySeats)[0]
      : { carNumber: 1, emptySeats: 0 };

    return {
      totalSeats,
      occupiedSeats,
      vacancy,
      occupancyRate: totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0,
      bestCar,
    };
  }, [threshold, train]);

  const selectedStats = useMemo(() => {
    const occupied = car.seats?.filter((seat) => seat.weight >= threshold).length ?? 0;
    const empty = (car.seats?.length ?? 0) - occupied;
    return {
      occupied,
      empty,
      rate: car.seats?.length ? Math.round((occupied / car.seats.length) * 100) : 0,
    };
  }, [car, threshold]);

  const toggleSeat = (seatId: string) => {
    setTrain((currentTrain) =>
      currentTrain.map((currentCar) =>
        currentCar.carNumber !== selectedCar
          ? currentCar
          : {
              ...currentCar,
              seats: currentCar.seats.map((seat) => {
                if (seat.id !== seatId) return seat;
                const nextWeight =
                  seat.weight >= threshold
                    ? Math.round(Math.random() * Math.max(6, threshold - 5))
                    : Math.round(45 + Math.random() * 28);
                return {
                  ...seat,
                  weight: nextWeight,
                  updatedAt: nowTime(),
                };
              }),
            },
      ),
    );
  };

  return (
    <main className="app-shell">
      <header className={`topbar line-${selectedLine}`}>
        <div className="topbar-heading">
          <div className="line-switcher" role="tablist" aria-label="지하철 호선 선택">
            {(Object.keys(lineConfigs) as Array<string>).map((key) => {
              const lineKey = Number(key) as LineKey;
              const config = lineConfigs[lineKey];
              return (
                <button
                  key={config.name}
                  type="button"
                  className={
                    selectedLine === lineKey ? `line-chip active line-${lineKey}` : `line-chip line-${lineKey}`
                  }
                  onClick={() => setSelectedLine(lineKey)}
                  role="tab"
                  aria-selected={selectedLine === lineKey}
                >
                  {config.name}
                </button>
              );
            })}
          </div>
          <span className={`line-badge line-${selectedLine}`}>{selectedLineConfig.name}</span>
          <h1>{selectedStation}</h1>
          <p className="subheading">{selectedLineConfig.name} 현재 역 기준 좌석 배치도</p>
        </div>
        <div className={isLive ? "status status-live" : "status"}>
          <span aria-hidden="true" />
          {isLive ? "실시간 모니터링" : "수동 점검 모드"}
        </div>
      </header>

      <section className="station-strip" aria-label={`${selectedLineConfig.name} 역 순환 정보`}>
        <div className="station-line-label">{selectedLineConfig.name} 역 순환</div>
        {routeSections.map((section) => (
          <div key={section.label} className="station-section">
            <div className="station-section-label">{section.label}</div>
            <div className="station-loop">
              {section.stations.map((station, index) => (
                <button
                  key={station}
                  type="button"
                  className={
                    station === selectedStation ? "station-node current" : "station-node"
                  }
                  onClick={() => setSelectedStation(station)}
                >
                  <span>{station}</span>
                  {index !== section.stations.length - 1 ? (
                    <i aria-hidden="true">→</i>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="control-strip" aria-label="열차와 센서 상태">
        <div>
          <span className="label">현재 시각</span>
          <strong>{currentTime}</strong>
        </div>
        <div>
          <span className="label">현재 역</span>
          <strong>{selectedStation}</strong>
        </div>
        <div>
          <span className="label">이전 역</span>
          <strong>{previousStation}</strong>
        </div>
        <div>
          <span className="label">다음 역</span>
          <strong>{nextStation}</strong>
        </div>
        <div>
          <span className="label">추천 차량</span>
          <strong>{trainSummary.bestCar.carNumber}호차</strong>
        </div>
        <div>
          <span className="label">빈 좌석</span>
          <strong>{trainSummary.vacancy}석</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <aside className="panel train-panel" aria-label="차량 선택">
          <div className="panel-heading">
            <span className="label">차량별 좌석 현황</span>
            <strong>{CAR_COUNT}량 편성 데모</strong>
          </div>

          <div className="car-list">
            {train.map((currentCar) => {
              const occupied = currentCar.seats.filter(
                (seat) => seat.weight >= threshold,
              ).length;
              const empty = currentCar.seats.length - occupied;
              const rate = Math.round((occupied / currentCar.seats.length) * 100);

              return (
                <button
                  className={currentCar.carNumber === selectedCar ? "car active" : "car"}
                  key={currentCar.carNumber}
                  onClick={() => setSelectedCar(currentCar.carNumber)}
                  type="button"
                  aria-pressed={currentCar.carNumber === selectedCar}
                >
                  <span>{currentCar.carNumber}호차</span>
                  <strong>{empty}석 비어 있음</strong>
                  <meter min="0" max="100" value={rate} aria-label={`${rate}% 점유`} />
                </button>
              );
            })}
          </div>
        </aside>

        <section className="panel seat-map-panel" aria-label="좌석 맵">
          <div className="seat-map-header">
            <div>
              <span className="label">현재 선택</span>
              <h2>{selectedCar}호차 좌석 맵</h2>
            </div>
            <div className="mini-stats" aria-label="선택 차량 통계">
              <span>
                빈 좌석 <strong>{selectedStats.empty}</strong>
              </span>
              <span>
                점유 <strong>{selectedStats.occupied}</strong>
              </span>
              <span>
                점유율 <strong>{selectedStats.rate}%</strong>
              </span>
            </div>
          </div>

          <div className="train-car-frame">
            <div className="door-line" aria-hidden="true">
              <span>출입문</span>
              <span>통로</span>
              <span>출입문</span>
            </div>

            <div className="seat-row" aria-label="왼쪽 좌석">
              {car.seats
                .filter((seat) => seat.row === "left")
                .map((seat) => {
                  const occupied = seat.weight >= threshold;
                  return (
                    <button
                      className={occupied ? "seat occupied" : "seat empty"}
                      key={seat.id}
                      onClick={() => toggleSeat(seat.id)}
                      type="button"
                      aria-label={`${seat.index}번 좌석, ${
                        occupied ? "점유" : "비어 있음"
                      }, ${seat.weight}kg`}
                    >
                      <span>{seat.index}</span>
                      <small>{seat.weight}kg</small>
                    </button>
                  );
                })}
            </div>

            <div className="aisle">
              <span>센서 게이트웨이 ESP32-CAR-{selectedCar}</span>
            </div>

            <div className="seat-row" aria-label="오른쪽 좌석">
              {car.seats
                .filter((seat) => seat.row === "right")
                .map((seat) => {
                  const occupied = seat.weight >= threshold;
                  return (
                    <button
                      className={occupied ? "seat occupied" : "seat empty"}
                      key={seat.id}
                      onClick={() => toggleSeat(seat.id)}
                      type="button"
                      aria-label={`${seat.index}번 좌석, ${
                        occupied ? "점유" : "비어 있음"
                      }, ${seat.weight}kg`}
                    >
                      <span>{seat.index}</span>
                      <small>{seat.weight}kg</small>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="legend" aria-label="범례">
            <span>
              <i className="swatch empty-swatch" /> 빈 좌석
            </span>
            <span>
              <i className="swatch occupied-swatch" /> 점유 좌석
            </span>
            <span>
              <i className="swatch stale-swatch" /> 임계값 {threshold}kg 기준
            </span>
          </div>
        </section>

        <aside className="panel sensor-panel" aria-label="센서 제어">
          <div className="panel-heading">
            <span className="label">센서 시뮬레이터</span>
            <strong>좌석만 감지</strong>
          </div>

          <button className="live-toggle" onClick={() => setIsLive((value) => !value)} type="button">
            {isLive ? "실시간 수신 정지" : "실시간 수신 시작"}
          </button>

          <label className="threshold">
            <span>
              착석 판단 임계값 <strong>{threshold}kg</strong>
            </span>
            <input
              min="10"
              max="35"
              onChange={(event) => setThreshold(Number(event.target.value))}
              type="range"
              value={threshold}
            />
          </label>

          <div className="sensor-feed">
            <span className="label">최근 센서 이벤트</span>
            <strong>{lastSensor}</strong>
          </div>

          <div className="system-flow" aria-label="데이터 흐름">
            <div>좌석 압력센서</div>
            <div>차량 게이트웨이</div>
            <div>서버 API</div>
            <div>승객 앱</div>
          </div>
        </aside>
      </section>
    </main>
  );
}
