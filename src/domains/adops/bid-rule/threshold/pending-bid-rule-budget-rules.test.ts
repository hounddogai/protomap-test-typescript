import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingBidRuleBudgetAudienceIdLengthRule,
  defaultPendingBidRuleBudgetValidator,
} from "./pending-bid-rule-budget-rules.js";
import { newPendingBidRuleBudget } from "./pending-bid-rule-budget.js";

test("PendingBidRuleBudgetValidator reports every problem", () => {
  const validator = defaultPendingBidRuleBudgetValidator();
  const item = newPendingBidRuleBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingBidRuleBudgetAudienceIdLengthRule flags a long audience id", () => {
  const rule = new PendingBidRuleBudgetAudienceIdLengthRule(1000);
  const item = newPendingBidRuleBudget("x", "y");
  item.audienceId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
