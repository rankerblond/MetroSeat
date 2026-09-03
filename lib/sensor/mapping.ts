import type { SeatLocation } from "./types";

const CAR_COUNT = 4;
const SEATS_PER_CAR = 28;

export function sensorIdFor(carNumber: number, seatIndex: number) {
  return `car-${carNumber}-seat-${String(seatIndex).padStart(2, "0")}`;
}

export function resolveSensor(sensorId: string): SeatLocation | null {
  const match = /^car-(\d+)-seat-(\d+)$/.exec(sensorId);
  if (!match) return null;

  const carNumber = Number(match[1]);
  const seatIndex = Number(match[2]);

  if (
    !Number.isInteger(carNumber) ||
    !Number.isInteger(seatIndex) ||
    carNumber < 1 ||
    carNumber > CAR_COUNT ||
    seatIndex < 1 ||
    seatIndex > SEATS_PER_CAR
  ) {
    return null;
  }

  return {
    carNumber,
    seatIndex,
    seatId: `${carNumber}-${String(seatIndex).padStart(2, "0")}`,
  };
}

export const sensorMap = Array.from({ length: CAR_COUNT }, (_, carOffset) =>
  Array.from({ length: SEATS_PER_CAR }, (_, seatOffset) => {
    const carNumber = carOffset + 1;
    const seatIndex = seatOffset + 1;
    return {
      sensorId: sensorIdFor(carNumber, seatIndex),
      carNumber,
      seatIndex,
      seatId: `${carNumber}-${String(seatIndex).padStart(2, "0")}`,
    };
  }),
).flat();
