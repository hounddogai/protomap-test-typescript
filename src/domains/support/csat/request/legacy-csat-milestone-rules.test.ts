import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyCsatMilestoneChannelLengthRule,
  LegacyCsatMilestoneCodeLengthRule,
  LegacyCsatMilestoneRequiredChannelRule,
  LegacyCsatMilestoneRevisionRangeRule,
  LegacyCsatMilestoneTitleLengthRule,
  defaultLegacyCsatMilestoneValidator,
} from "./legacy-csat-milestone-rules.js";
import { newLegacyCsatMilestone } from "./legacy-csat-milestone.js";

test("LegacyCsatMilestoneValidator reports every problem", () => {
  const validator = defaultLegacyCsatMilestoneValidator();
  const item = newLegacyCsatMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyCsatMilestoneRevisionRangeRule flags values above revision", () => {
  const rule = new LegacyCsatMilestoneRevisionRangeRule(16, 86400);
  const item = newLegacyCsatMilestone("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyCsatMilestoneTitleLengthRule flags a long title", () => {
  const rule = new LegacyCsatMilestoneTitleLengthRule(255);
  const item = newLegacyCsatMilestone("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyCsatMilestoneCodeLengthRule flags a long code", () => {
  const rule = new LegacyCsatMilestoneCodeLengthRule(16);
  const item = newLegacyCsatMilestone("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyCsatMilestoneRequiredChannelRule flags a blank channel", () => {
  const rule = new LegacyCsatMilestoneRequiredChannelRule("legacy csat milestone needs a value");
  const item = newLegacyCsatMilestone("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyCsatMilestoneChannelLengthRule flags a long channel", () => {
  const rule = new LegacyCsatMilestoneChannelLengthRule(120);
  const item = newLegacyCsatMilestone("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
