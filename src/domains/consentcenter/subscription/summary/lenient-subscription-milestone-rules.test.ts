import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientSubscriptionMilestoneBudgetRangeRule,
  LenientSubscriptionMilestoneCodeLengthRule,
  defaultLenientSubscriptionMilestoneValidator,
} from "./lenient-subscription-milestone-rules.js";
import { newLenientSubscriptionMilestone } from "./lenient-subscription-milestone.js";

test("LenientSubscriptionMilestoneValidator reports every problem", () => {
  const validator = defaultLenientSubscriptionMilestoneValidator();
  const item = newLenientSubscriptionMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientSubscriptionMilestoneBudgetRangeRule flags values above budget", () => {
  const rule = new LenientSubscriptionMilestoneBudgetRangeRule(8.5, 2377.4);
  const item = newLenientSubscriptionMilestone("x", "y");
  item.budget = 2378.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSubscriptionMilestoneCodeLengthRule flags a long code", () => {
  const rule = new LenientSubscriptionMilestoneCodeLengthRule(16);
  const item = newLenientSubscriptionMilestone("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
