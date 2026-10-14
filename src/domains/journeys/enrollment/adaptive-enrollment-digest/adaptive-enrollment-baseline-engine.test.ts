import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveEnrollmentBaselineEngine } from "./adaptive-enrollment-baseline-engine.js";
import { newAdaptiveEnrollmentBaseline } from "./adaptive-enrollment-baseline.js";

test("AdaptiveEnrollmentBaselineEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveEnrollmentBaselineEngine(flags.newRegistry());
  const item = newAdaptiveEnrollmentBaseline("code-674", "name-904");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
