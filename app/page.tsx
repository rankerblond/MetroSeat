"use client";

import { useEffect, useMemo, useState } from "react";
import { chooseBestCar, getGatewayStatus, summarizeCars } from "@/lib/metro/metrics";
import { lineConfigs, type LineKey } from "@/lib/metro/lines";

const CAR_COUNT = 4;
const SEATS_PER_CAR = 28;
const DEFAULT_THRESHOLD = 18;

type Seat = {
  id: string;
  row: "left" | "right";
  index: number;
  weight: number;
  updatedAt: string;
  source: "simulation" | "sensor";
};

type TrainCar = {
  carNumber: number;
  seats: Seat[];
};

type ApiSeat = {
  seatId: string;
  carNumber: number;
  seatIndex: number;
  weight: number;
  occupied: boolean;
  updatedAt: string;
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
      updatedAt: new Date().toISOString(),
      source: "simulation",
    };
  });

const initialTrain = (): TrainCar[] =>
  Array.from({ length: CAR_COUNT }, (_, carIndex) => ({
    carNumber: carIndex + 1,
    seats: buildSeats(carIndex + 1),
  }));

function mergeSensorSeats(currentTrain: TrainCar[], apiSeats: ApiSeat[]) {
  const byId = new Map(apiSeats.map((seat) => [seat.seatId, seat]));
  return currentTrain.map((car) => ({
    ...car,
    seats: car.seats.map((seat) => {
      const sensorSeat = byId.get(seat.id);
      if (!sensorSeat) return seat;
      return {
        ...seat,
        weight: sensorSeat.weight,
        updatedAt: sensorSeat.updatedAt,
        source: "sensor" as const,
      };
    }),
  }));
}

export default function Home() {
  const [train, setTrain] = useState<TrainCar[]>(initialTrain);
  const [selectedLine, setSelectedLine] = useState<LineKey>(4);
  const [selectedCar, setSelectedCar] = useState(1);
  const [selectedStation, setSelectedStation] = useState(lineConfigs[4].defaultStation);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [isLive, setIsLive] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [lastReceivedAt, setLastReceivedAt] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<"sensor" | "simulation">("simulation");
  const [apiMessage, setApiMessage] = useState("D1 센서 데이터 대기 중");

  const selectedLineConfig = lineConfigs[selectedLine];
  const routeStations = selectedLineConfig.stations;
  const selectedStationIndex = routeStations.indexOf(selectedStation);
  const previousStation = selectedStationIndex > 0 ? routeStations[selectedStationIndex - 1] : "없음";
  const nextStation =
    selectedStationIndex >= 0 && selectedStationIndex < routeStations.length - 1
      ? routeStations[selectedStationIndex + 1]
      : "없음";

  useEffect(() => {
    setSelectedStation(selectedLineConfig.defaultStation);
  }, [selectedLineConfig.defaultStation]);

  useEffect(() => {
    setCurrentTime(nowTime());
    const clock = window.setInterval(() => setCurrentTime(nowTime()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!isLive) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch("/api/seats", { cache: "no-store" });
        if (!response.ok) throw new Error(`seat API ${response.status}`);

        const payload = (await response.json()) as { seats?: ApiSeat[] };
        const seats = Array.isArray(payload.seats) ? payload.seats : [];
        if (cancelled || seats.length === 0) return;

        setTrain((current) => mergeSensorSeats(current, seats));
        const latest = [...seats]
          .map((seat) => seat.updatedAt)
          .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
        setLastReceivedAt(latest ?? new Date().toISOString());
        setDataMode("sensor");
        setApiMessage(`${seats.length}개 센서 좌석 상태 동기화`);
      } catch {
        if (!cancelled) {
          setDataMode("simulation");
          setApiMessage("D1 미연결 · 시뮬레이션 모드 유지");
        }
      }
    };

    void poll();
    const timer = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isLive]);

  useEffect(() => {
    if (!isLive || dataMode === "sensor") return;

    const interval = window.setInterval(() => {
      setTrain((currentTrain) => {
        const carIndex = Math.floor(Math.random() * currentTrain.length);
        const seatIndex = Math.floor(Math.random() * SEATS_PER_CAR);
        const nextTrain = currentTrain.map((car) => ({
          ...car,
          seats: car.seats.map((seat) => ({ ...seat })),
        }));
        const seat = nextTrain[carIndex].seats[seatIndex];
        const shouldOccupy = seat.weight >= threshold ? Math.random() > 0.22 : Math.random() > 0.48;

        seat.weight = shouldOccupy
          ? Math.round(38 + Math.random() * 42)
          : Math.round(Math.random() * Math.max(6, threshold - 6));
        seat.updatedAt = new Date().toISOString();
        seat.source = "simulation";
        return nextTrain;
      });
    }, 1500);

    return () => window.clearInterval(interval);
  }, [dataMode, isLive, threshold]);

  const allMetricSeats = useMemo(
    () =>
      train.flatMap((car) =>
        car.seats.map((seat) => ({ carNumber: car.carNumber, weight: seat.weight })),
      ),
    [train],
  );

  const carSummaries = useMemo(
    () => summarizeCars(allMetricSeats, CAR_COUNT, SEATS_PER_CAR, threshold),
    [allMetricSeats, threshold],
  );
  const bestCar = useMemo(() => chooseBestCar(carSummaries), [carSummaries]);
  const car = train[selectedCar - 1] ?? train[0];
  const selectedStats = carSummaries[selectedCar - 1];
  const totalVacancy = carSummaries.reduce((sum, item) => sum + item.empty, 0);
  const gatewayStatus = getGatewayStatus(lastReceivedAt);
  const gatewayLabel = {
    waiting: "센서 대기",
    connected: "센서 연결됨",
    stale: "센서 수신 지연",
    error: "센서 시간 오류",
  }[gatewayStatus];

  const toggleSeat = (seatId: string) => {
    if (dataMode === "sensor") return;
    setTrain((currentTrain) =>
      currentTrain.map((currentCar) =>
        currentCar.carNumber !== selectedCar
          ? currentCar
          : {
              ...currentCar,
              seats: currentCar.seats.map((seat) =>
                seat.id !== seatId
                  ? seat
                  : {
                      ...seat,
                      weight:
                        seat.weight >= threshold
                          ? Math.round(Math.random() * Math.max(6, threshold - 5))
                          : Math.round(45 + Math.random() * 28),
                      updatedAt: new Date().toISOString(),
                      source: "simulation" as const,
                    },
              ),
            },
      ),
    );
  };

  return (
    <main className="app-shell">
      <header className={`topbar line-${selectedLine}`}>
        <div className="topbar-heading">
          <div className="line-switcher" role="tablist" aria-label="지하철 호선 선택">
            {(Object.keys(lineConfigs) as string[]).map((key) => {
              const lineKey = Number(key) as LineKey;
              const config = lineConfigs[lineKey];
              return (
                <button
                  key={config.name}
                  type="button"
                  className={selectedLine === lineKey ? `line-chip active line-${lineKey}` : `line-chip line-${lineKey}`}
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
          <p className="subheading">MetroSeat · 좌석 점유 모니터링 MVP</p>
        </div>
        <div className={isLive ? "status status-live" : "status"}>
          <span aria-hidden="true" />
          {isLive ? `${gatewayLabel} · ${dataMode === "sensor" ? "D1" : "SIM"}` : "모니터링 일시정지"}
        </div>
      </header>

      <section className="station-strip" aria-label={`${selectedLineConfig.name} 대표 역`}>
        <div className="station-line-label">{selectedLineConfig.name} 대표 역</div>
        <div className="station-section">
          <div className="station-loop">
            {routeStations.map((station, index) => (
              <button
                key={`${selectedLine}-${station}`}
                type="button"
                className={station === selectedStation ? "station-node current" : "station-node"}
                onClick={() => setSelectedStation(station)}
              >
                <span>{station}</span>
                {index !== routeStations.length - 1 ? <i aria-hidden="true">→</i> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="control-strip" aria-label="열차와 센서 상태">
        <div><span className="label">현재 시각</span><strong>{currentTime}</strong></div>
        <div><span className="label">현재 역</span><strong>{selectedStation}</strong></div>
        <div><span className="label">이전 역</span><strong>{previousStation}</strong></div>
        <div><span className="label">다음 역</span><strong>{nextStation}</strong></div>
        <div><span className="label">추천 차량</span><strong>{bestCar?.carNumber ?? 1}호차</strong></div>
        <div><span className="label">전체 빈 좌석</span><strong>{totalVacancy}석</strong></div>
      </section>

      <section className="dashboard-grid">
        <aside className="panel train-panel" aria-label="차량 선택">
          <div className="panel-heading">
            <span className="label">차량별 혼잡도</span>
            <strong>{bestCar ? `${bestCar.carNumber}호차 추천` : "계산 중"}</strong>
          </div>
          <div className="car-list">
            {carSummaries.map((summary) => (
              <button
                className={summary.carNumber === selectedCar ? "car active" : "car"}
                key={summary.carNumber}
                onClick={() => setSelectedCar(summary.carNumber)}
                type="button"
                aria-pressed={summary.carNumber === selectedCar}
              >
                <span>{summary.carNumber}호차 {bestCar?.carNumber === summary.carNumber ? "★" : ""}</span>
                <strong>{summary.empty}석 비어 있음</strong>
                <meter min="0" max="100" value={summary.occupancyRate} aria-label={`${summary.occupancyRate}% 점유`} />
              </button>
            ))}
          </div>
        </aside>

        <section className="panel seat-map-panel" aria-label="좌석 맵">
          <div className="seat-map-header">
            <div><span className="label">현재 선택</span><h2>{selectedCar}호차 좌석 맵</h2></div>
            <div className="mini-stats" aria-label="선택 차량 통계">
              <span>빈 좌석 <strong>{selectedStats?.empty ?? 0}</strong></span>
              <span>점유 <strong>{selectedStats?.occupied ?? 0}</strong></span>
              <span>점유율 <strong>{selectedStats?.occupancyRate ?? 0}%</strong></span>
            </div>
          </div>

          <div className="train-car-frame">
            <div className="door-line" aria-hidden="true"><span>출입문</span><span>통로</span><span>출입문</span></div>
            {(["left", "right"] as const).map((row, rowIndex) => (
              <div key={row}>
                {rowIndex === 1 ? <div className="aisle"><span>게이트웨이 ESP32-CAR-{selectedCar} · {gatewayLabel}</span></div> : null}
                <div className="seat-row" aria-label={row === "left" ? "왼쪽 좌석" : "오른쪽 좌석"}>
                  {car.seats.filter((seat) => seat.row === row).map((seat) => {
                    const occupied = seat.weight >= threshold;
                    return (
                      <button
                        className={occupied ? "seat occupied" : "seat empty"}
                        key={seat.id}
                        onClick={() => toggleSeat(seat.id)}
                        type="button"
                        aria-label={`${seat.index}번 좌석, ${occupied ? "점유" : "비어 있음"}, ${seat.weight}kg`}
                      >
                        <span>{seat.index}</span>
                        <small>{seat.weight}kg</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="legend" aria-label="범례">
            <span><i className="swatch empty-swatch" /> 빈 좌석</span>
            <span><i className="swatch occupied-swatch" /> 점유 좌석</span>
            <span><i className="swatch stale-swatch" /> 임계값 {threshold}kg</span>
          </div>
        </section>

        <aside className="panel sensor-panel" aria-label="센서 제어">
          <div className="panel-heading">
            <span className="label">센서 게이트웨이</span>
            <strong>{gatewayLabel}</strong>
          </div>
          <button className="live-toggle" onClick={() => setIsLive((value) => !value)} type="button">
            {isLive ? "실시간 수신 정지" : "실시간 수신 시작"}
          </button>
          <label className="threshold">
            <span>착석 판단 임계값 <strong>{threshold}kg</strong></span>
            <input min="10" max="35" onChange={(event) => setThreshold(Number(event.target.value))} type="range" value={threshold} />
          </label>
          <div className="sensor-feed">
            <span className="label">데이터 상태</span>
            <strong>{apiMessage}</strong>
            <small>{lastReceivedAt ? `마지막 수신 ${new Date(lastReceivedAt).toLocaleTimeString("ko-KR")}` : "실제 센서 이벤트 없음"}</small>
          </div>
          <div className="system-flow" aria-label="데이터 흐름">
            <div>좌석 압력센서</div><div>ESP32 게이트웨이</div><div>Sensor API + D1</div><div>MetroSeat UI</div>
          </div>
        </aside>
      </section>
    </main>
  );
}
