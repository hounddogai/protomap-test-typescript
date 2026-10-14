import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveEnrollmentAuditEngine } from "./adaptive-enrollment-audit-engine.js";
import { newAdaptiveEnrollmentAudit } from "./adaptive-enrollment-audit.js";

test("AdaptiveEnrollmentAuditEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveEnrollmentAuditEngine();
  const item = newAdaptiveEnrollmentAudit("code-764", "name-451");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
