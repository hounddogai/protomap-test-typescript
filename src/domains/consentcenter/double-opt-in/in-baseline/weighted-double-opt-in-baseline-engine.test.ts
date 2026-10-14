import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedDoubleOptInBaselineEngine } from "./weighted-double-opt-in-baseline-engine.js";
import { newWeightedDoubleOptInBaseline } from "./weighted-double-opt-in-baseline.js";

test("WeightedDoubleOptInBaselineEngine keeps results within bounds", () => {
  const engine = defaultWeightedDoubleOptInBaselineEngine();
  const item = newWeightedDoubleOptInBaseline("code-30", "name-154");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
