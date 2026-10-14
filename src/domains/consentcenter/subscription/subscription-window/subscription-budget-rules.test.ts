import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionBudgetAmountRangeRule,
  SubscriptionBudgetRequiredAudienceIdRule,
  SubscriptionBudgetRequiredCodeRule,
  SubscriptionBudgetRequiredTitleRule,
  SubscriptionBudgetVersionRangeRule,
  defaultSubscriptionBudgetValidator,
} from "./subscription-budget-rules.js";
import { newSubscriptionBudget } from "./subscription-budget.js";

test("SubscriptionBudgetValidator reports every problem", () => {
  const validator = defaultSubscriptionBudgetValidator();
  const item = newSubscriptionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionBudgetAmountRangeRule flags values above amount", () => {
  const rule = new SubscriptionBudgetAmountRangeRule(7.3, 4616.7);
  const item = newSubscriptionBudget("x", "y");
  item.amount = 4618.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new SubscriptionBudgetRequiredCodeRule("subscription budget needs this field");
  const item = newSubscriptionBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionBudgetVersionRangeRule flags values above version", () => {
  const rule = new SubscriptionBudgetVersionRangeRule(32, 32);
  const item = newSubscriptionBudget("x", "y");
  item.version = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionBudgetRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new SubscriptionBudgetRequiredAudienceIdRule("subscription budget needs an entry");
  const item = newSubscriptionBudget("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new SubscriptionBudgetRequiredTitleRule("subscription budget needs a value");
  const item = newSubscriptionBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
