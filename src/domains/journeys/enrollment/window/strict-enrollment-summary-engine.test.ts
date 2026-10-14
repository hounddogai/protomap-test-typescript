import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictEnrollmentSummaryEngine } from "./strict-enrollment-summary-engine.js";
import { newStrictEnrollmentSummary } from "./strict-enrollment-summary.js";

test("StrictEnrollmentSummaryEngine keeps results within bounds", () => {
  const engine = defaultStrictEnrollmentSummaryEngine(flags.newRegistry());
  const item = newStrictEnrollmentSummary("code-506", "title-181");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
