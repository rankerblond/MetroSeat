import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sensorEvents = sqliteTable(
  "sensor_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sensorId: text("sensor_id").notNull(),
    carNumber: integer("car_number").notNull(),
    seatIndex: integer("seat_index").notNull(),
    seatId: text("seat_id").notNull(),
    weight: real("weight").notNull(),
    occupied: integer("occupied", { mode: "boolean" }).notNull(),
    timestamp: text("timestamp").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("sensor_events_seat_id_idx").on(table.seatId),
    index("sensor_events_timestamp_idx").on(table.timestamp),
  ],
);

export const seatStates = sqliteTable("seat_states", {
  seatId: text("seat_id").primaryKey(),
  sensorId: text("sensor_id").notNull(),
  carNumber: integer("car_number").notNull(),
  seatIndex: integer("seat_index").notNull(),
  weight: real("weight").notNull(),
  occupied: integer("occupied", { mode: "boolean" }).notNull(),
  updatedAt: text("updated_at").notNull(),
});
