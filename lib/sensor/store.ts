import { resolveSensor } from "./mapping";
import type { SeatState, SensorEvent } from "./types";

const DEFAULT_THRESHOLD = 18;
const seatStates = new Map<string, SeatState>();

export function ingestSensorEvent(event: SensorEvent, threshold = DEFAULT_THRESHOLD) {
  const location = resolveSensor(event.sensorId);
  if (!location) {
    throw new Error(`Unknown sensorId: ${event.sensorId}`);
  }

  if (!Number.isFinite(event.weight) || event.weight < 0 || event.weight > 300) {
    throw new Error("weight must be a finite number between 0 and 300");
  }

  const timestamp = new Date(event.timestamp);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("timestamp must be a valid ISO date string");
  }

  const state: SeatState = {
    ...location,
    sensorId: event.sensorId,
    weight: event.weight,
    occupied: event.weight >= threshold,
    updatedAt: timestamp.toISOString(),
  };

  seatStates.set(location.seatId, state);
  return state;
}

export function getSeatStates(carNumber?: number) {
  const states = Array.from(seatStates.values());
  return typeof carNumber === "number"
    ? states.filter((state) => state.carNumber === carNumber)
    : states;
}

export function getSeatState(seatId: string) {
  return seatStates.get(seatId) ?? null;
}
