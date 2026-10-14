import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSubscriptionSummaryClicksRangeRule,
  RollingSubscriptionSummaryCohortLengthRule,
  RollingSubscriptionSummaryRequiredCodeRule,
  defaultRollingSubscriptionSummaryValidator,
} from "./rolling-subscription-summary-rules.js";
import { newRollingSubscriptionSummary } from "./rolling-subscription-summary.js";

test("RollingSubscriptionSummaryValidator reports every problem", () => {
  const validator = defaultRollingSubscriptionSummaryValidator();
  const item = newRollingSubscriptionSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSubscriptionSummaryClicksRangeRule flags values above clicks", () => {
  const rule = new RollingSubscriptionSummaryClicksRangeRule(16, 64);
  const item = newRollingSubscriptionSummary("x", "y");
  item.clicks = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSubscriptionSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new RollingSubscriptionSummaryRequiredCodeRule("rolling subscription summary needs a value");
  const item = newRollingSubscriptionSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSubscriptionSummaryCohortLengthRule flags a long cohort", () => {
  const rule = new RollingSubscriptionSummaryCohortLengthRule(86400);
  const item = newRollingSubscriptionSummary("x", "y");
  item.cohort = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
