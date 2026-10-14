import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightSnapshotEngine } from "./flight-snapshot-engine.js";
import { newFlightSnapshot } from "./flight-snapshot.js";

test("FlightSnapshotEngine keeps results within bounds", () => {
  const engine = defaultFlightSnapshotEngine(flags.newRegistry());
  const item = newFlightSnapshot("code-296", "name-975");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
