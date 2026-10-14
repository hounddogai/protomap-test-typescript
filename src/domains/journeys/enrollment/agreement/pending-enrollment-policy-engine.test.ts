import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingEnrollmentPolicyEngine } from "./pending-enrollment-policy-engine.js";
import { newPendingEnrollmentPolicy } from "./pending-enrollment-policy.js";

test("PendingEnrollmentPolicyEngine keeps results within bounds", () => {
  const engine = defaultPendingEnrollmentPolicyEngine(flags.newRegistry());
  const item = newPendingEnrollmentPolicy("code-682", "title-475");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
