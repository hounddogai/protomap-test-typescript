import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSubscriptionMilestoneCostRangeRule,
  RollingSubscriptionMilestoneJourneyIdLengthRule,
  RollingSubscriptionMilestoneRequiredChannelRule,
  RollingSubscriptionMilestoneTitleLengthRule,
  defaultRollingSubscriptionMilestoneValidator,
} from "./rolling-subscription-milestone-rules.js";
import { newRollingSubscriptionMilestone } from "./rolling-subscription-milestone.js";

test("RollingSubscriptionMilestoneValidator reports every problem", () => {
  const validator = defaultRollingSubscriptionMilestoneValidator();
  const item = newRollingSubscriptionMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSubscriptionMilestoneTitleLengthRule flags a long title", () => {
  const rule = new RollingSubscriptionMilestoneTitleLengthRule(1000);
  const item = newRollingSubscriptionMilestone("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSubscriptionMilestoneJourneyIdLengthRule flags a long journey id", () => {
  const rule = new RollingSubscriptionMilestoneJourneyIdLengthRule(86400);
  const item = newRollingSubscriptionMilestone("x", "y");
  item.journeyId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSubscriptionMilestoneCostRangeRule flags values above cost", () => {
  const rule = new RollingSubscriptionMilestoneCostRangeRule(8, 3244.9);
  const item = newRollingSubscriptionMilestone("x", "y");
  item.cost = 3246.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSubscriptionMilestoneRequiredChannelRule flags a blank channel", () => {
  const rule = new RollingSubscriptionMilestoneRequiredChannelRule("rolling subscription milestone needs an entry");
  const item = newRollingSubscriptionMilestone("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
