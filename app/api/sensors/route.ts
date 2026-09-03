import { NextResponse } from "next/server";
import { persistSeatState } from "@/lib/sensor/repository";
import { ingestSensorEvent } from "@/lib/sensor/store";
import type { SensorEvent } from "@/lib/sensor/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<SensorEvent>;

    if (
      typeof payload.sensorId !== "string" ||
      typeof payload.weight !== "number" ||
      typeof payload.timestamp !== "string"
    ) {
      return NextResponse.json(
        {
          error: "INVALID_PAYLOAD",
          message: "sensorId, weight, timestamp are required",
        },
        { status: 400 },
      );
    }

    const state = ingestSensorEvent({
      sensorId: payload.sensorId,
      weight: payload.weight,
      timestamp: payload.timestamp,
    });

    await persistSeatState(state);

    return NextResponse.json({ ok: true, seat: state }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isDatabaseError = message.includes("D1 binding");

    return NextResponse.json(
      {
        error: isDatabaseError ? "DATABASE_UNAVAILABLE" : "SENSOR_INGEST_FAILED",
        message,
      },
      { status: isDatabaseError ? 503 : 400 },
    );
  }
}
