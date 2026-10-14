import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientRewardRuleMilestoneBidRangeRule,
  LenientRewardRuleMilestoneCapacityRangeRule,
  LenientRewardRuleMilestoneCodeLengthRule,
  LenientRewardRuleMilestoneTitleLengthRule,
  defaultLenientRewardRuleMilestoneValidator,
} from "./lenient-reward-rule-milestone-rules.js";
import { newLenientRewardRuleMilestone } from "./lenient-reward-rule-milestone.js";

test("LenientRewardRuleMilestoneValidator reports every problem", () => {
  const validator = defaultLenientRewardRuleMilestoneValidator();
  const item = newLenientRewardRuleMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientRewardRuleMilestoneCodeLengthRule flags a long code", () => {
  const rule = new LenientRewardRuleMilestoneCodeLengthRule(1000);
  const item = newLenientRewardRuleMilestone("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRewardRuleMilestoneCapacityRangeRule flags values above capacity", () => {
  const rule = new LenientRewardRuleMilestoneCapacityRangeRule(64, 86400);
  const item = newLenientRewardRuleMilestone("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientRewardRuleMilestoneBidRangeRule flags values above bid", () => {
  const rule = new LenientRewardRuleMilestoneBidRangeRule(7.8, 3277.2);
  const item = newLenientRewardRuleMilestone("x", "y");
  item.bid = 3278.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientRewardRuleMilestoneTitleLengthRule flags a long title", () => {
  const rule = new LenientRewardRuleMilestoneTitleLengthRule(1000);
  const item = newLenientRewardRuleMilestone("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
