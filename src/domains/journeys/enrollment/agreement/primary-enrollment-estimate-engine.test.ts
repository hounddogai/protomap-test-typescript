import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryEnrollmentEstimateEngine } from "./primary-enrollment-estimate-engine.js";
import { newPrimaryEnrollmentEstimate } from "./primary-enrollment-estimate.js";

test("PrimaryEnrollmentEstimateEngine keeps results within bounds", () => {
  const engine = defaultPrimaryEnrollmentEstimateEngine(flags.newRegistry());
  const item = newPrimaryEnrollmentEstimate("code-228", "name-343");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
