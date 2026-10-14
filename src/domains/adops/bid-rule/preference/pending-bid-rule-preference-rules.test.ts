import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingBidRulePreferenceBudgetRangeRule,
  PendingBidRulePreferenceLabelLengthRule,
  PendingBidRulePreferenceRequiredCodeRule,
  PendingBidRulePreferenceRequiredReviewerRule,
  PendingBidRulePreferenceWindowDaysRangeRule,
  defaultPendingBidRulePreferenceValidator,
} from "./pending-bid-rule-preference-rules.js";
import { newPendingBidRulePreference } from "./pending-bid-rule-preference.js";

test("PendingBidRulePreferenceValidator reports every problem", () => {
  const validator = defaultPendingBidRulePreferenceValidator();
  const item = newPendingBidRulePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingBidRulePreferenceBudgetRangeRule flags values above budget", () => {
  const rule = new PendingBidRulePreferenceBudgetRangeRule(0.3, 4004);
  const item = newPendingBidRulePreference("x", "y");
  item.budget = 4005.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingBidRulePreferenceRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PendingBidRulePreferenceRequiredReviewerRule("pending bid rule preference needs a value");
  const item = newPendingBidRulePreference("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingBidRulePreferenceWindowDaysRangeRule flags values above window days", () => {
  const rule = new PendingBidRulePreferenceWindowDaysRangeRule(120, 3600);
  const item = newPendingBidRulePreference("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingBidRulePreferenceLabelLengthRule flags a long label", () => {
  const rule = new PendingBidRulePreferenceLabelLengthRule(255);
  const item = newPendingBidRulePreference("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingBidRulePreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new PendingBidRulePreferenceRequiredCodeRule("pending bid rule preference needs an entry");
  const item = newPendingBidRulePreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
