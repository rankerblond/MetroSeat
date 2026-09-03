import { NextResponse } from "next/server";
import { listSeatStates } from "@/lib/sensor/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const carParam = searchParams.get("car");

  let carNumber: number | undefined;
  if (carParam !== null) {
    carNumber = Number(carParam);
    if (!Number.isInteger(carNumber) || carNumber < 1 || carNumber > 4) {
      return NextResponse.json(
        {
          error: "INVALID_CAR",
          message: "car must be an integer between 1 and 4",
        },
        { status: 400 },
      );
    }
  }

  try {
    const seats = await listSeatStates(carNumber);
    return NextResponse.json({
      ok: true,
      carNumber: carNumber ?? null,
      count: seats.length,
      seats,
    });
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
