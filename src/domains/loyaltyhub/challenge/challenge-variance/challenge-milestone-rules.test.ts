import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeMilestoneBudgetRangeRule,
  ChallengeMilestoneStartsAtRangeRule,
  ChallengeMilestoneUpdatedAtRangeRule,
  ChallengeMilestoneVariantLengthRule,
  defaultChallengeMilestoneValidator,
} from "./challenge-milestone-rules.js";
import { newChallengeMilestone } from "./challenge-milestone.js";

test("ChallengeMilestoneValidator reports every problem", () => {
  const validator = defaultChallengeMilestoneValidator();
  const item = newChallengeMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeMilestoneVariantLengthRule flags a long variant", () => {
  const rule = new ChallengeMilestoneVariantLengthRule(3600);
  const item = newChallengeMilestone("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeMilestoneBudgetRangeRule flags values above budget", () => {
  const rule = new ChallengeMilestoneBudgetRangeRule(4.2, 3424.1);
  const item = newChallengeMilestone("x", "y");
  item.budget = 3425.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeMilestoneUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new ChallengeMilestoneUpdatedAtRangeRule(32, 64);
  const item = newChallengeMilestone("x", "y");
  item.updatedAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeMilestoneStartsAtRangeRule flags values above starts at", () => {
  const rule = new ChallengeMilestoneStartsAtRangeRule(80, 80);
  const item = newChallengeMilestone("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
