import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyMentionMilestoneChecksumLengthRule,
  LegacyMentionMilestoneLabelLengthRule,
  LegacyMentionMilestoneRequiredLabelRule,
  defaultLegacyMentionMilestoneValidator,
} from "./legacy-mention-milestone-rules.js";
import { newLegacyMentionMilestone } from "./legacy-mention-milestone.js";

test("LegacyMentionMilestoneValidator reports every problem", () => {
  const validator = defaultLegacyMentionMilestoneValidator();
  const item = newLegacyMentionMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyMentionMilestoneLabelLengthRule flags a long label", () => {
  const rule = new LegacyMentionMilestoneLabelLengthRule(3600);
  const item = newLegacyMentionMilestone("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyMentionMilestoneChecksumLengthRule flags a long checksum", () => {
  const rule = new LegacyMentionMilestoneChecksumLengthRule(80);
  const item = newLegacyMentionMilestone("x", "y");
  item.checksum = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyMentionMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyMentionMilestoneRequiredLabelRule("legacy mention milestone needs a value");
  const item = newLegacyMentionMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
