import { NextResponse } from "next/server";
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

    return NextResponse.json({ ok: true, seat: state }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "SENSOR_INGEST_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
