import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionMilestoneAmountRangeRule,
  MentionMilestoneLabelLengthRule,
  defaultMentionMilestoneValidator,
} from "./mention-milestone-rules.js";
import { newMentionMilestone } from "./mention-milestone.js";

test("MentionMilestoneValidator reports every problem", () => {
  const validator = defaultMentionMilestoneValidator();
  const item = newMentionMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionMilestoneAmountRangeRule flags values above amount", () => {
  const rule = new MentionMilestoneAmountRangeRule(7.5, 236);
  const item = newMentionMilestone("x", "y");
  item.amount = 237.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionMilestoneLabelLengthRule flags a long label", () => {
  const rule = new MentionMilestoneLabelLengthRule(86400);
  const item = newMentionMilestone("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
