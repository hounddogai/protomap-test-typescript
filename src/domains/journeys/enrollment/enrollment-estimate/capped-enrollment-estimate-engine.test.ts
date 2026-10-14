import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedEnrollmentEstimateEngine } from "./capped-enrollment-estimate-engine.js";
import { newCappedEnrollmentEstimate } from "./capped-enrollment-estimate.js";

test("CappedEnrollmentEstimateEngine keeps results within bounds", () => {
  const engine = defaultCappedEnrollmentEstimateEngine();
  const item = newCappedEnrollmentEstimate("code-652", "title-890");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
