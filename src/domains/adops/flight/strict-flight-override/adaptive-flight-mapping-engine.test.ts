import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveFlightMappingEngine } from "./adaptive-flight-mapping-engine.js";
import { newAdaptiveFlightMapping } from "./adaptive-flight-mapping.js";

test("AdaptiveFlightMappingEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveFlightMappingEngine();
  const item = newAdaptiveFlightMapping("code-291", "name-967");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
