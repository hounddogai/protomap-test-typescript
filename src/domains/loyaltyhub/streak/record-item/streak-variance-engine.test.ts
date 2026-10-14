import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStreakVarianceEngine } from "./streak-variance-engine.js";
import { newStreakVariance } from "./streak-variance.js";

test("StreakVarianceEngine keeps results within bounds", () => {
  const engine = defaultStreakVarianceEngine();
  const item = newStreakVariance("code-284", "label-721");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
