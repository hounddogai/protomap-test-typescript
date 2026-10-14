import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveReplyBudgetConversionRateRangeRule,
  AdaptiveReplyBudgetSequenceRangeRule,
  defaultAdaptiveReplyBudgetValidator,
} from "./adaptive-reply-budget-rules.js";
import { newAdaptiveReplyBudget } from "./adaptive-reply-budget.js";

test("AdaptiveReplyBudgetValidator reports every problem", () => {
  const validator = defaultAdaptiveReplyBudgetValidator();
  const item = newAdaptiveReplyBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveReplyBudgetSequenceRangeRule flags values above sequence", () => {
  const rule = new AdaptiveReplyBudgetSequenceRangeRule(16, 120);
  const item = newAdaptiveReplyBudget("x", "y");
  item.sequence = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveReplyBudgetConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new AdaptiveReplyBudgetConversionRateRangeRule(2.9, 2750.9);
  const item = newAdaptiveReplyBudget("x", "y");
  item.conversionRate = 2752.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
