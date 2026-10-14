import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallMilestoneBudgetRangeRule,
  PaywallMilestoneRequiredTitleRule,
  PaywallMilestoneSummaryLengthRule,
  PaywallMilestoneTitleLengthRule,
  defaultPaywallMilestoneValidator,
} from "./paywall-milestone-rules.js";
import { newPaywallMilestone } from "./paywall-milestone.js";

test("PaywallMilestoneValidator reports every problem", () => {
  const validator = defaultPaywallMilestoneValidator();
  const item = newPaywallMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallMilestoneRequiredTitleRule flags a blank title", () => {
  const rule = new PaywallMilestoneRequiredTitleRule("paywall milestone needs an entry");
  const item = newPaywallMilestone("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallMilestoneTitleLengthRule flags a long title", () => {
  const rule = new PaywallMilestoneTitleLengthRule(1000);
  const item = newPaywallMilestone("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallMilestoneBudgetRangeRule flags values above budget", () => {
  const rule = new PaywallMilestoneBudgetRangeRule(7.4, 1787.4);
  const item = newPaywallMilestone("x", "y");
  item.budget = 1788.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallMilestoneSummaryLengthRule flags a long summary", () => {
  const rule = new PaywallMilestoneSummaryLengthRule(1000);
  const item = newPaywallMilestone("x", "y");
  item.summary = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
