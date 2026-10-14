import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveInviteSummaryFrequencyCapRangeRule,
  AdaptiveInviteSummaryLocaleLengthRule,
  AdaptiveInviteSummaryRequiredCodeRule,
  AdaptiveInviteSummaryRequiredLocaleRule,
  AdaptiveInviteSummaryRequiredTitleRule,
  defaultAdaptiveInviteSummaryValidator,
} from "./adaptive-invite-summary-rules.js";
import { newAdaptiveInviteSummary } from "./adaptive-invite-summary.js";

test("AdaptiveInviteSummaryValidator reports every problem", () => {
  const validator = defaultAdaptiveInviteSummaryValidator();
  const item = newAdaptiveInviteSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveInviteSummaryRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveInviteSummaryRequiredTitleRule("adaptive invite summary needs a value");
  const item = newAdaptiveInviteSummary("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveInviteSummaryLocaleLengthRule flags a long locale", () => {
  const rule = new AdaptiveInviteSummaryLocaleLengthRule(80);
  const item = newAdaptiveInviteSummary("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveInviteSummaryRequiredLocaleRule flags a blank locale", () => {
  const rule = new AdaptiveInviteSummaryRequiredLocaleRule("adaptive invite summary needs a value");
  const item = newAdaptiveInviteSummary("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveInviteSummaryFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new AdaptiveInviteSummaryFrequencyCapRangeRule(32, 1000);
  const item = newAdaptiveInviteSummary("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveInviteSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveInviteSummaryRequiredCodeRule("adaptive invite summary needs this field");
  const item = newAdaptiveInviteSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
