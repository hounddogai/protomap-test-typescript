import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionSummaryEngine } from "./deflection-summary-engine.js";
import { newDeflectionSummary } from "./deflection-summary.js";

test("DeflectionSummaryEngine keeps results within bounds", () => {
  const engine = defaultDeflectionSummaryEngine(flags.newRegistry());
  const item = newDeflectionSummary("code-618", "label-446");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
