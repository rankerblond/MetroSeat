export type MetricSeat = {
  carNumber: number;
  weight: number;
};

export type CarSummary = {
  carNumber: number;
  occupied: number;
  empty: number;
  total: number;
  occupancyRate: number;
};

export function isOccupied(weight: number, threshold: number) {
  return weight >= threshold;
}

export function summarizeCars(
  seats: MetricSeat[],
  carCount: number,
  seatsPerCar: number,
  threshold: number,
): CarSummary[] {
  return Array.from({ length: carCount }, (_, index) => {
    const carNumber = index + 1;
    const carSeats = seats.filter((seat) => seat.carNumber === carNumber);
    const total = carSeats.length || seatsPerCar;
    const occupied = carSeats.filter((seat) => isOccupied(seat.weight, threshold)).length;
    const empty = Math.max(total - occupied, 0);

    return {
      carNumber,
      occupied,
      empty,
      total,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  });
}

export function chooseBestCar(summaries: CarSummary[]) {
  return [...summaries].sort((a, b) => {
    if (b.empty !== a.empty) return b.empty - a.empty;
    if (a.occupancyRate !== b.occupancyRate) return a.occupancyRate - b.occupancyRate;
    return a.carNumber - b.carNumber;
  })[0] ?? null;
}

export function getGatewayStatus(lastReceivedAt: string | null, now = Date.now()) {
  if (!lastReceivedAt) return "waiting" as const;
  const receivedAt = new Date(lastReceivedAt).getTime();
  if (Number.isNaN(receivedAt)) return "error" as const;
  return now - receivedAt <= 10_000 ? ("connected" as const) : ("stale" as const);
}
