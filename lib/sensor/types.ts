export type SensorEvent = {
  sensorId: string;
  weight: number;
  timestamp: string;
};

export type SeatLocation = {
  carNumber: number;
  seatIndex: number;
  seatId: string;
};

export type SeatState = SeatLocation & {
  sensorId: string;
  weight: number;
  occupied: boolean;
  updatedAt: string;
};
