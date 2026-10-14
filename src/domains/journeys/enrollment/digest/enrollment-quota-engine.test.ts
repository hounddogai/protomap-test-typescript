import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentQuotaEngine } from "./enrollment-quota-engine.js";
import { newEnrollmentQuota } from "./enrollment-quota.js";

test("EnrollmentQuotaEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentQuotaEngine();
  const item = newEnrollmentQuota("code-139", "label-828");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
