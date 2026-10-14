import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedActivationMilestoneCostRangeRule,
  CappedActivationMilestoneLabelLengthRule,
  CappedActivationMilestoneRequiredChannelRule,
  CappedActivationMilestoneRequiredNotesRule,
  defaultCappedActivationMilestoneValidator,
} from "./capped-activation-milestone-rules.js";
import { newCappedActivationMilestone } from "./capped-activation-milestone.js";

test("CappedActivationMilestoneValidator reports every problem", () => {
  const validator = defaultCappedActivationMilestoneValidator();
  const item = newCappedActivationMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedActivationMilestoneRequiredChannelRule flags a blank channel", () => {
  const rule = new CappedActivationMilestoneRequiredChannelRule("capped activation milestone needs this field");
  const item = newCappedActivationMilestone("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedActivationMilestoneLabelLengthRule flags a long label", () => {
  const rule = new CappedActivationMilestoneLabelLengthRule(64);
  const item = newCappedActivationMilestone("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedActivationMilestoneRequiredNotesRule flags a blank notes", () => {
  const rule = new CappedActivationMilestoneRequiredNotesRule("capped activation milestone needs this field");
  const item = newCappedActivationMilestone("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedActivationMilestoneCostRangeRule flags values above cost", () => {
  const rule = new CappedActivationMilestoneCostRangeRule(5.3, 414.1);
  const item = newCappedActivationMilestone("x", "y");
  item.cost = 415.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
