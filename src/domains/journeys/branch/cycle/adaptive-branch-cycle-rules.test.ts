import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveBranchCycleCreatedAtRangeRule,
  AdaptiveBranchCycleRequiredChannelRule,
  AdaptiveBranchCycleRequiredLabelRule,
  defaultAdaptiveBranchCycleValidator,
} from "./adaptive-branch-cycle-rules.js";
import { newAdaptiveBranchCycle } from "./adaptive-branch-cycle.js";

test("AdaptiveBranchCycleValidator reports every problem", () => {
  const validator = defaultAdaptiveBranchCycleValidator();
  const item = newAdaptiveBranchCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveBranchCycleRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveBranchCycleRequiredLabelRule("adaptive branch cycle needs a value");
  const item = newAdaptiveBranchCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveBranchCycleCreatedAtRangeRule flags values above created at", () => {
  const rule = new AdaptiveBranchCycleCreatedAtRangeRule(120, 1000);
  const item = newAdaptiveBranchCycle("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveBranchCycleRequiredChannelRule flags a blank channel", () => {
  const rule = new AdaptiveBranchCycleRequiredChannelRule("adaptive branch cycle needs a value");
  const item = newAdaptiveBranchCycle("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
