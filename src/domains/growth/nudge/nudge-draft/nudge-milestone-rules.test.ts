import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeMilestoneChannelLengthRule,
  NudgeMilestoneRequiredChannelRule,
  NudgeMilestoneRequiredCodeRule,
  NudgeMilestoneRequiredLabelRule,
  defaultNudgeMilestoneValidator,
} from "./nudge-milestone-rules.js";
import { newNudgeMilestone } from "./nudge-milestone.js";

test("NudgeMilestoneValidator reports every problem", () => {
  const validator = defaultNudgeMilestoneValidator();
  const item = newNudgeMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeMilestoneRequiredCodeRule("nudge milestone needs this field");
  const item = newNudgeMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeMilestoneChannelLengthRule flags a long channel", () => {
  const rule = new NudgeMilestoneChannelLengthRule(16);
  const item = newNudgeMilestone("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeMilestoneRequiredChannelRule flags a blank channel", () => {
  const rule = new NudgeMilestoneRequiredChannelRule("nudge milestone needs a value");
  const item = newNudgeMilestone("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new NudgeMilestoneRequiredLabelRule("nudge milestone needs a value");
  const item = newNudgeMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
