import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEnrollmentSummaryEngine } from "./enrollment-summary-engine.js";
import { newEnrollmentSummary } from "./enrollment-summary.js";

test("EnrollmentSummaryEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentSummaryEngine(flags.newRegistry());
  const item = newEnrollmentSummary("code-390", "title-873");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
