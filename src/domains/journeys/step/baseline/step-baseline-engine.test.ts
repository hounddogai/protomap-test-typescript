import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStepBaselineEngine } from "./step-baseline-engine.js";
import { newStepBaseline } from "./step-baseline.js";

test("StepBaselineEngine keeps results within bounds", () => {
  const engine = defaultStepBaselineEngine();
  const item = newStepBaseline("code-360", "title-359");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
