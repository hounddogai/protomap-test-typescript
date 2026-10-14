import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingStepPolicyEngine } from "./rolling-step-policy-engine.js";
import { newRollingStepPolicy } from "./rolling-step-policy.js";

test("RollingStepPolicyEngine keeps results within bounds", () => {
  const engine = defaultRollingStepPolicyEngine();
  const item = newRollingStepPolicy("code-207", "label-316");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
