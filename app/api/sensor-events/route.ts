import { NextResponse } from "next/server";
import { listRecentSensorEvents } from "@/lib/sensor/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const parsed = limitParam === null ? 20 : Number(limitParam);
  const limit = Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), 100) : 20;

  try {
    const events = await listRecentSensorEvents(limit);
    return NextResponse.json({ ok: true, count: events.length, events });
  } catch (error) {
    return NextResponse.json(
      {
        error: "DATABASE_UNAVAILABLE",
        message: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 503 },
    );
  }
}
