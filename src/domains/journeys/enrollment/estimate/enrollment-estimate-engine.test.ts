import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentEstimateEngine } from "./enrollment-estimate-engine.js";
import { newEnrollmentEstimate } from "./enrollment-estimate.js";

test("EnrollmentEstimateEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentEstimateEngine();
  const item = newEnrollmentEstimate("code-901", "label-796");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
