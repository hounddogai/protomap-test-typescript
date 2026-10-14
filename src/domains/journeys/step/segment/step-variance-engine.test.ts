import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStepVarianceEngine } from "./step-variance-engine.js";
import { newStepVariance } from "./step-variance.js";

test("StepVarianceEngine keeps results within bounds", () => {
  const engine = defaultStepVarianceEngine();
  const item = newStepVariance("code-703", "name-371");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
