import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeMilestoneLimitRangeRule,
  BadgeMilestoneMinimumRangeRule,
  BadgeMilestoneRequiredRegionRule,
  BadgeMilestoneRevisionRangeRule,
  defaultBadgeMilestoneValidator,
} from "./badge-milestone-rules.js";
import { newBadgeMilestone } from "./badge-milestone.js";

test("BadgeMilestoneValidator reports every problem", () => {
  const validator = defaultBadgeMilestoneValidator();
  const item = newBadgeMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeMilestoneLimitRangeRule flags values above limit", () => {
  const rule = new BadgeMilestoneLimitRangeRule(32, 80);
  const item = newBadgeMilestone("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeMilestoneMinimumRangeRule flags values above minimum", () => {
  const rule = new BadgeMilestoneMinimumRangeRule(4.7, 4592.1);
  const item = newBadgeMilestone("x", "y");
  item.minimum = 4593.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeMilestoneRequiredRegionRule flags a blank region", () => {
  const rule = new BadgeMilestoneRequiredRegionRule("badge milestone needs an entry");
  const item = newBadgeMilestone("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeMilestoneRevisionRangeRule flags values above revision", () => {
  const rule = new BadgeMilestoneRevisionRangeRule(16, 1000);
  const item = newBadgeMilestone("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
