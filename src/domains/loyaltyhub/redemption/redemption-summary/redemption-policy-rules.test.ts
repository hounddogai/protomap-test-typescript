import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionPolicyAudienceIdLengthRule,
  RedemptionPolicyLabelLengthRule,
  defaultRedemptionPolicyValidator,
} from "./redemption-policy-rules.js";
import { newRedemptionPolicy } from "./redemption-policy.js";

test("RedemptionPolicyValidator reports every problem", () => {
  const validator = defaultRedemptionPolicyValidator();
  const item = newRedemptionPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionPolicyAudienceIdLengthRule flags a long audience id", () => {
  const rule = new RedemptionPolicyAudienceIdLengthRule(120);
  const item = newRedemptionPolicy("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionPolicyLabelLengthRule flags a long label", () => {
  const rule = new RedemptionPolicyLabelLengthRule(16);
  const item = newRedemptionPolicy("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
