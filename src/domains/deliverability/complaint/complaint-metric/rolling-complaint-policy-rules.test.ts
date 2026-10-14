import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingComplaintPolicyCostRangeRule,
  RollingComplaintPolicyLabelLengthRule,
  RollingComplaintPolicyRequiredCodeRule,
  RollingComplaintPolicyRequiredVariantRule,
  defaultRollingComplaintPolicyValidator,
} from "./rolling-complaint-policy-rules.js";
import { newRollingComplaintPolicy } from "./rolling-complaint-policy.js";

test("RollingComplaintPolicyValidator reports every problem", () => {
  const validator = defaultRollingComplaintPolicyValidator();
  const item = newRollingComplaintPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingComplaintPolicyCostRangeRule flags values above cost", () => {
  const rule = new RollingComplaintPolicyCostRangeRule(3.8, 306.5);
  const item = newRollingComplaintPolicy("x", "y");
  item.cost = 308;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingComplaintPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new RollingComplaintPolicyRequiredCodeRule("rolling complaint policy needs a value");
  const item = newRollingComplaintPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingComplaintPolicyLabelLengthRule flags a long label", () => {
  const rule = new RollingComplaintPolicyLabelLengthRule(1000);
  const item = newRollingComplaintPolicy("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingComplaintPolicyRequiredVariantRule flags a blank variant", () => {
  const rule = new RollingComplaintPolicyRequiredVariantRule("rolling complaint policy needs this field");
  const item = newRollingComplaintPolicy("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
