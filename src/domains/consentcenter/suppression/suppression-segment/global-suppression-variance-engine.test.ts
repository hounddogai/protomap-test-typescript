import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalSuppressionVarianceEngine } from "./global-suppression-variance-engine.js";
import { newGlobalSuppressionVariance } from "./global-suppression-variance.js";

test("GlobalSuppressionVarianceEngine keeps results within bounds", () => {
  const engine = defaultGlobalSuppressionVarianceEngine();
  const item = newGlobalSuppressionVariance("code-997", "label-826");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
