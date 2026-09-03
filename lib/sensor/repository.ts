import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { seatStates, sensorEvents } from "@/db/schema";
import type { SeatState } from "./types";

export async function persistSeatState(state: SeatState) {
  const db = getDb();

  await db.insert(sensorEvents).values({
    sensorId: state.sensorId,
    carNumber: state.carNumber,
    seatIndex: state.seatIndex,
    seatId: state.seatId,
    weight: state.weight,
    occupied: state.occupied,
    timestamp: state.updatedAt,
  });

  await db
    .insert(seatStates)
    .values(state)
    .onConflictDoUpdate({
      target: seatStates.seatId,
      set: {
        sensorId: state.sensorId,
        carNumber: state.carNumber,
        seatIndex: state.seatIndex,
        weight: state.weight,
        occupied: state.occupied,
        updatedAt: state.updatedAt,
      },
    });

  return state;
}

export async function listSeatStates(carNumber?: number) {
  const db = getDb();

  if (typeof carNumber === "number") {
    return db
      .select()
      .from(seatStates)
      .where(eq(seatStates.carNumber, carNumber))
      .orderBy(seatStates.seatIndex);
  }

  return db.select().from(seatStates).orderBy(seatStates.carNumber, seatStates.seatIndex);
}

export async function listRecentSensorEvents(limit = 20) {
  const db = getDb();
  return db
    .select()
    .from(sensorEvents)
    .orderBy(desc(sensorEvents.timestamp), desc(sensorEvents.id))
    .limit(limit);
}
