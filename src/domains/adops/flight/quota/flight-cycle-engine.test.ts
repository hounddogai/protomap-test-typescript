import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFlightCycleEngine } from "./flight-cycle-engine.js";
import { newFlightCycle } from "./flight-cycle.js";

test("FlightCycleEngine keeps results within bounds", () => {
  const engine = defaultFlightCycleEngine();
  const item = newFlightCycle("code-532", "title-848");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
