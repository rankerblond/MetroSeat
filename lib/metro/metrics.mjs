export function isOccupied(weight, threshold) {
  return weight >= threshold;
}

export function summarizeCars(seats, carCount, seatsPerCar, threshold) {
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

export function chooseBestCar(summaries) {
  return [...summaries].sort((a, b) => {
    if (b.empty !== a.empty) return b.empty - a.empty;
    if (a.occupancyRate !== b.occupancyRate) return a.occupancyRate - b.occupancyRate;
    return a.carNumber - b.carNumber;
  })[0] ?? null;
}

export function getGatewayStatus(lastReceivedAt, now = Date.now()) {
  if (!lastReceivedAt) return "waiting";
  const receivedAt = new Date(lastReceivedAt).getTime();
  if (Number.isNaN(receivedAt)) return "error";
  return now - receivedAt <= 10_000 ? "connected" : "stale";
}
