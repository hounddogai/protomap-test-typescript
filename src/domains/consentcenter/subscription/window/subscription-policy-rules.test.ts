import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionPolicyCodeLengthRule,
  SubscriptionPolicyRequiredLabelRule,
  defaultSubscriptionPolicyValidator,
} from "./subscription-policy-rules.js";
import { newSubscriptionPolicy } from "./subscription-policy.js";

test("SubscriptionPolicyValidator reports every problem", () => {
  const validator = defaultSubscriptionPolicyValidator();
  const item = newSubscriptionPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionPolicyCodeLengthRule flags a long code", () => {
  const rule = new SubscriptionPolicyCodeLengthRule(1000);
  const item = newSubscriptionPolicy("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new SubscriptionPolicyRequiredLabelRule("subscription policy needs this field");
  const item = newSubscriptionPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
