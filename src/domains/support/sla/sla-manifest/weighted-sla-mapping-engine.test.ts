import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedSlaMappingEngine } from "./weighted-sla-mapping-engine.js";
import { newWeightedSlaMapping } from "./weighted-sla-mapping.js";

test("WeightedSlaMappingEngine keeps results within bounds", () => {
  const engine = defaultWeightedSlaMappingEngine();
  const item = newWeightedSlaMapping("code-731", "name-889");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
