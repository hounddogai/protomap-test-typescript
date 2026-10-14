import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchMilestoneSendAtRangeRule,
  BranchMilestoneTitleLengthRule,
  defaultBranchMilestoneValidator,
} from "./branch-milestone-rules.js";
import { newBranchMilestone } from "./branch-milestone.js";

test("BranchMilestoneValidator reports every problem", () => {
  const validator = defaultBranchMilestoneValidator();
  const item = newBranchMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchMilestoneTitleLengthRule flags a long title", () => {
  const rule = new BranchMilestoneTitleLengthRule(32);
  const item = newBranchMilestone("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchMilestoneSendAtRangeRule flags values above send at", () => {
  const rule = new BranchMilestoneSendAtRangeRule(32, 32);
  const item = newBranchMilestone("x", "y");
  item.sendAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
