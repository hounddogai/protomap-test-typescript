import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupMilestoneChannelLengthRule,
  WarmupMilestoneRequiredChannelRule,
  WarmupMilestoneRequiredCodeRule,
  defaultWarmupMilestoneValidator,
} from "./warmup-milestone-rules.js";
import { newWarmupMilestone } from "./warmup-milestone.js";

test("WarmupMilestoneValidator reports every problem", () => {
  const validator = defaultWarmupMilestoneValidator();
  const item = newWarmupMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupMilestoneRequiredChannelRule flags a blank channel", () => {
  const rule = new WarmupMilestoneRequiredChannelRule("warmup milestone needs this field");
  const item = newWarmupMilestone("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupMilestoneChannelLengthRule flags a long channel", () => {
  const rule = new WarmupMilestoneChannelLengthRule(64);
  const item = newWarmupMilestone("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new WarmupMilestoneRequiredCodeRule("warmup milestone needs an entry");
  const item = newWarmupMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
