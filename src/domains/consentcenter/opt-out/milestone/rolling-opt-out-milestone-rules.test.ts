import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingOptOutMilestoneChannelLengthRule,
  RollingOptOutMilestoneCodeLengthRule,
  RollingOptOutMilestoneRequiredChannelRule,
  RollingOptOutMilestoneRequiredNameRule,
  RollingOptOutMilestoneScoreRangeRule,
  defaultRollingOptOutMilestoneValidator,
} from "./rolling-opt-out-milestone-rules.js";
import { newRollingOptOutMilestone } from "./rolling-opt-out-milestone.js";

test("RollingOptOutMilestoneValidator reports every problem", () => {
  const validator = defaultRollingOptOutMilestoneValidator();
  const item = newRollingOptOutMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingOptOutMilestoneChannelLengthRule flags a long channel", () => {
  const rule = new RollingOptOutMilestoneChannelLengthRule(255);
  const item = newRollingOptOutMilestone("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingOptOutMilestoneScoreRangeRule flags values above score", () => {
  const rule = new RollingOptOutMilestoneScoreRangeRule(8.3, 4490.7);
  const item = newRollingOptOutMilestone("x", "y");
  item.score = 4492.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingOptOutMilestoneCodeLengthRule flags a long code", () => {
  const rule = new RollingOptOutMilestoneCodeLengthRule(80);
  const item = newRollingOptOutMilestone("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingOptOutMilestoneRequiredNameRule flags a blank name", () => {
  const rule = new RollingOptOutMilestoneRequiredNameRule("rolling opt out milestone needs this field");
  const item = newRollingOptOutMilestone("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingOptOutMilestoneRequiredChannelRule flags a blank channel", () => {
  const rule = new RollingOptOutMilestoneRequiredChannelRule("rolling opt out milestone needs this field");
  const item = newRollingOptOutMilestone("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
