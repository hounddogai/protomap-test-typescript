import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentPolicyEngine } from "./enrollment-policy-engine.js";
import { newEnrollmentPolicy } from "./enrollment-policy.js";

test("EnrollmentPolicyEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentPolicyEngine();
  const item = newEnrollmentPolicy("code-952", "name-356");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
