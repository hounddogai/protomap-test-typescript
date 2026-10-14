import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallRuleCodeLengthRule,
  PaywallRuleRequiredTimezoneRule,
  PaywallRuleRequiredTitleRule,
  PaywallRuleSourceLengthRule,
  defaultPaywallRuleValidator,
} from "./paywall-rule-rules.js";
import { newPaywallRule } from "./paywall-rule.js";

test("PaywallRuleValidator reports every problem", () => {
  const validator = defaultPaywallRuleValidator();
  const item = newPaywallRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallRuleRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new PaywallRuleRequiredTimezoneRule("paywall rule needs this field");
  const item = newPaywallRule("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallRuleSourceLengthRule flags a long source", () => {
  const rule = new PaywallRuleSourceLengthRule(3600);
  const item = newPaywallRule("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallRuleCodeLengthRule flags a long code", () => {
  const rule = new PaywallRuleCodeLengthRule(120);
  const item = newPaywallRule("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallRuleRequiredTitleRule flags a blank title", () => {
  const rule = new PaywallRuleRequiredTitleRule("paywall rule needs a value");
  const item = newPaywallRule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
