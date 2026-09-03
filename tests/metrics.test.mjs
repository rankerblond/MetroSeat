import assert from "node:assert/strict";
import test from "node:test";
import {
  chooseBestCar,
  getGatewayStatus,
  isOccupied,
  summarizeCars,
} from "../lib/metro/metrics.mjs";

test("weight equal to threshold is occupied", () => {
  assert.equal(isOccupied(18, 18), true);
  assert.equal(isOccupied(17.9, 18), false);
});

test("summarizeCars calculates occupied, empty and rate", () => {
  const summary = summarizeCars(
    [
      { carNumber: 1, weight: 40 },
      { carNumber: 1, weight: 0 },
      { carNumber: 2, weight: 30 },
      { carNumber: 2, weight: 31 },
    ],
    2,
    2,
    18,
  );

  assert.deepEqual(summary[0], {
    carNumber: 1,
    occupied: 1,
    empty: 1,
    total: 2,
    occupancyRate: 50,
  });
  assert.equal(summary[1].occupancyRate, 100);
});

test("chooseBestCar prefers more empty seats then lower occupancy", () => {
  const best = chooseBestCar([
    { carNumber: 1, occupied: 20, empty: 8, total: 28, occupancyRate: 71 },
    { carNumber: 2, occupied: 15, empty: 13, total: 28, occupancyRate: 54 },
    { carNumber: 3, occupied: 18, empty: 10, total: 28, occupancyRate: 64 },
  ]);
  assert.equal(best?.carNumber, 2);
});

test("gateway status changes when data becomes stale", () => {
  const now = Date.parse("2026-09-03T05:00:20.000Z");
  assert.equal(getGatewayStatus(null, now), "waiting");
  assert.equal(getGatewayStatus("2026-09-03T05:00:15.000Z", now), "connected");
  assert.equal(getGatewayStatus("2026-09-03T05:00:00.000Z", now), "stale");
  assert.equal(getGatewayStatus("not-a-date", now), "error");
});
