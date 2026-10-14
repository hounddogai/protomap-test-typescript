import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallBudgetBatchSizeRangeRule,
  PaywallBudgetGraceDaysRangeRule,
  PaywallBudgetRequiredAudienceIdRule,
  PaywallBudgetRequiredLabelRule,
  PaywallBudgetScoreRangeRule,
  defaultPaywallBudgetValidator,
} from "./paywall-budget-rules.js";
import { newPaywallBudget } from "./paywall-budget.js";

test("PaywallBudgetValidator reports every problem", () => {
  const validator = defaultPaywallBudgetValidator();
  const item = newPaywallBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallBudgetGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PaywallBudgetGraceDaysRangeRule(16, 120);
  const item = newPaywallBudget("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new PaywallBudgetRequiredLabelRule("paywall budget needs an entry");
  const item = newPaywallBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallBudgetBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PaywallBudgetBatchSizeRangeRule(32, 255);
  const item = newPaywallBudget("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallBudgetScoreRangeRule flags values above score", () => {
  const rule = new PaywallBudgetScoreRangeRule(6.6, 3830.9);
  const item = newPaywallBudget("x", "y");
  item.score = 3832.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallBudgetRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PaywallBudgetRequiredAudienceIdRule("paywall budget needs this field");
  const item = newPaywallBudget("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
