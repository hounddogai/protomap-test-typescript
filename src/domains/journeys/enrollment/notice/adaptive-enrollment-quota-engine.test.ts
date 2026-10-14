import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveEnrollmentQuotaEngine } from "./adaptive-enrollment-quota-engine.js";
import { newAdaptiveEnrollmentQuota } from "./adaptive-enrollment-quota.js";

test("AdaptiveEnrollmentQuotaEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveEnrollmentQuotaEngine();
  const item = newAdaptiveEnrollmentQuota("code-718", "name-333");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
