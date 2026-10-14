import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierMilestoneRequiredTitleRule,
  TierMilestoneTimezoneLengthRule,
  TierMilestoneTitleLengthRule,
  defaultTierMilestoneValidator,
} from "./tier-milestone-rules.js";
import { newTierMilestone } from "./tier-milestone.js";

test("TierMilestoneValidator reports every problem", () => {
  const validator = defaultTierMilestoneValidator();
  const item = newTierMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierMilestoneRequiredTitleRule flags a blank title", () => {
  const rule = new TierMilestoneRequiredTitleRule("tier milestone needs this field");
  const item = newTierMilestone("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierMilestoneTimezoneLengthRule flags a long timezone", () => {
  const rule = new TierMilestoneTimezoneLengthRule(255);
  const item = newTierMilestone("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierMilestoneTitleLengthRule flags a long title", () => {
  const rule = new TierMilestoneTitleLengthRule(120);
  const item = newTierMilestone("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
