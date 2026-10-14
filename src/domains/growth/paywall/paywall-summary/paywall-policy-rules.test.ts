import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallPolicyNameLengthRule,
  PaywallPolicyRequiredDescriptionRule,
  PaywallPolicyRequiredSummaryRule,
  PaywallPolicySummaryLengthRule,
  PaywallPolicyWindowDaysRangeRule,
  defaultPaywallPolicyValidator,
} from "./paywall-policy-rules.js";
import { newPaywallPolicy } from "./paywall-policy.js";

test("PaywallPolicyValidator reports every problem", () => {
  const validator = defaultPaywallPolicyValidator();
  const item = newPaywallPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallPolicyRequiredSummaryRule flags a blank summary", () => {
  const rule = new PaywallPolicyRequiredSummaryRule("paywall policy needs a value");
  const item = newPaywallPolicy("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallPolicySummaryLengthRule flags a long summary", () => {
  const rule = new PaywallPolicySummaryLengthRule(120);
  const item = newPaywallPolicy("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallPolicyWindowDaysRangeRule flags values above window days", () => {
  const rule = new PaywallPolicyWindowDaysRangeRule(255, 3600);
  const item = newPaywallPolicy("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallPolicyNameLengthRule flags a long name", () => {
  const rule = new PaywallPolicyNameLengthRule(64);
  const item = newPaywallPolicy("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallPolicyRequiredDescriptionRule flags a blank description", () => {
  const rule = new PaywallPolicyRequiredDescriptionRule("paywall policy needs this field");
  const item = newPaywallPolicy("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
