import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightEntryEngine } from "./flight-entry-engine.js";
import { newFlightEntry } from "./flight-entry.js";

test("FlightEntryEngine keeps results within bounds", () => {
  const engine = defaultFlightEntryEngine(flags.newRegistry());
  const item = newFlightEntry("code-257", "label-181");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
