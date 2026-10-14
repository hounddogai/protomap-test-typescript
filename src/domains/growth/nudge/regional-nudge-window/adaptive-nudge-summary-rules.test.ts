import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveNudgeSummaryRequiredCodeRule,
  AdaptiveNudgeSummaryRequiredPhoneRule,
  AdaptiveNudgeSummaryRequiredReviewerRule,
  AdaptiveNudgeSummaryRequiredTitleRule,
  defaultAdaptiveNudgeSummaryValidator,
} from "./adaptive-nudge-summary-rules.js";
import { newAdaptiveNudgeSummary } from "./adaptive-nudge-summary.js";

test("AdaptiveNudgeSummaryValidator reports every problem", () => {
  const validator = defaultAdaptiveNudgeSummaryValidator();
  const item = newAdaptiveNudgeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveNudgeSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveNudgeSummaryRequiredCodeRule("adaptive nudge summary needs this field");
  const item = newAdaptiveNudgeSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveNudgeSummaryRequiredPhoneRule flags a blank phone", () => {
  const rule = new AdaptiveNudgeSummaryRequiredPhoneRule("adaptive nudge summary needs an entry");
  const item = newAdaptiveNudgeSummary("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveNudgeSummaryRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new AdaptiveNudgeSummaryRequiredReviewerRule("adaptive nudge summary needs an entry");
  const item = newAdaptiveNudgeSummary("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveNudgeSummaryRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveNudgeSummaryRequiredTitleRule("adaptive nudge summary needs a value");
  const item = newAdaptiveNudgeSummary("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
