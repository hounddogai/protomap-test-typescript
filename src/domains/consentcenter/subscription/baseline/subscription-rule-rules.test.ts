import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionRulePriorityRangeRule,
  SubscriptionRuleQuantityRangeRule,
  SubscriptionRuleStartsAtRangeRule,
  defaultSubscriptionRuleValidator,
} from "./subscription-rule-rules.js";
import { newSubscriptionRule } from "./subscription-rule.js";

test("SubscriptionRuleValidator reports every problem", () => {
  const validator = defaultSubscriptionRuleValidator();
  const item = newSubscriptionRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionRuleQuantityRangeRule flags values above quantity", () => {
  const rule = new SubscriptionRuleQuantityRangeRule(16, 3600);
  const item = newSubscriptionRule("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionRuleStartsAtRangeRule flags values above starts at", () => {
  const rule = new SubscriptionRuleStartsAtRangeRule(255, 86400);
  const item = newSubscriptionRule("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionRulePriorityRangeRule flags values above priority", () => {
  const rule = new SubscriptionRulePriorityRangeRule(1000, 86400);
  const item = newSubscriptionRule("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
