import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientStreakVarianceEngine } from "./lenient-streak-variance-engine.js";
import { newLenientStreakVariance } from "./lenient-streak-variance.js";

test("LenientStreakVarianceEngine keeps results within bounds", () => {
  const engine = defaultLenientStreakVarianceEngine();
  const item = newLenientStreakVariance("code-65", "title-456");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
