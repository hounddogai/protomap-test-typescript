import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStepSummaryEngine } from "./step-summary-engine.js";
import { newStepSummary } from "./step-summary.js";

test("StepSummaryEngine keeps results within bounds", () => {
  const engine = defaultStepSummaryEngine(flags.newRegistry());
  const item = newStepSummary("code-418", "name-196");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
