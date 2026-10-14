import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultApprovalPolicyEngine } from "./approval-policy-engine.js";
import { newApprovalPolicy } from "./approval-policy.js";

test("ApprovalPolicyEngine keeps results within bounds", () => {
  const engine = defaultApprovalPolicyEngine(flags.newRegistry());
  const item = newApprovalPolicy("code-637", "name-77");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
