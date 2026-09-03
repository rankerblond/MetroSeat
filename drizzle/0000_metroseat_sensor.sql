CREATE TABLE `sensor_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `sensor_id` text NOT NULL,
  `car_number` integer NOT NULL,
  `seat_index` integer NOT NULL,
  `seat_id` text NOT NULL,
  `weight` real NOT NULL,
  `occupied` integer NOT NULL,
  `timestamp` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seat_states` (
  `seat_id` text PRIMARY KEY NOT NULL,
  `sensor_id` text NOT NULL,
  `car_number` integer NOT NULL,
  `seat_index` integer NOT NULL,
  `weight` real NOT NULL,
  `occupied` integer NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sensor_events_seat_id_idx` ON `sensor_events` (`seat_id`);
--> statement-breakpoint
CREATE INDEX `sensor_events_timestamp_idx` ON `sensor_events` (`timestamp`);
