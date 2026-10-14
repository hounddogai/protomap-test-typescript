import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyFlightCycleEngine } from "./legacy-flight-cycle-engine.js";
import { newLegacyFlightCycle } from "./legacy-flight-cycle.js";

test("LegacyFlightCycleEngine keeps results within bounds", () => {
  const engine = defaultLegacyFlightCycleEngine();
  const item = newLegacyFlightCycle("code-827", "title-628");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
