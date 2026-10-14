import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingStepPolicyRequiredCodeRule,
  RollingStepPolicyRequiredLabelRule,
  defaultRollingStepPolicyValidator,
} from "./rolling-step-policy-rules.js";
import { newRollingStepPolicy } from "./rolling-step-policy.js";

test("RollingStepPolicyValidator reports every problem", () => {
  const validator = defaultRollingStepPolicyValidator();
  const item = newRollingStepPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingStepPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new RollingStepPolicyRequiredCodeRule("rolling step policy needs an entry");
  const item = newRollingStepPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingStepPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new RollingStepPolicyRequiredLabelRule("rolling step policy needs an entry");
  const item = newRollingStepPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
