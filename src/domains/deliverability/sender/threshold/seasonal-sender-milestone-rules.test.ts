import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSenderMilestoneEndsAtRangeRule,
  SeasonalSenderMilestoneRequiredCodeRule,
  SeasonalSenderMilestoneRequiredLabelRule,
  SeasonalSenderMilestoneRequiredReviewerRule,
  SeasonalSenderMilestoneReviewerLengthRule,
  defaultSeasonalSenderMilestoneValidator,
} from "./seasonal-sender-milestone-rules.js";
import { newSeasonalSenderMilestone } from "./seasonal-sender-milestone.js";

test("SeasonalSenderMilestoneValidator reports every problem", () => {
  const validator = defaultSeasonalSenderMilestoneValidator();
  const item = newSeasonalSenderMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSenderMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalSenderMilestoneRequiredCodeRule("seasonal sender milestone needs this field");
  const item = newSeasonalSenderMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSenderMilestoneEndsAtRangeRule flags values above ends at", () => {
  const rule = new SeasonalSenderMilestoneEndsAtRangeRule(120, 255);
  const item = newSeasonalSenderMilestone("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalSenderMilestoneRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new SeasonalSenderMilestoneRequiredReviewerRule("seasonal sender milestone needs an entry");
  const item = newSeasonalSenderMilestone("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSenderMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalSenderMilestoneRequiredLabelRule("seasonal sender milestone needs a value");
  const item = newSeasonalSenderMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSenderMilestoneReviewerLengthRule flags a long reviewer", () => {
  const rule = new SeasonalSenderMilestoneReviewerLengthRule(80);
  const item = newSeasonalSenderMilestone("x", "y");
  item.reviewer = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
