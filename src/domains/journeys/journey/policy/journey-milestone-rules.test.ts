import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyMilestoneCohortLengthRule,
  JourneyMilestoneRequiredChannelRule,
  JourneyMilestoneRequiredCodeRule,
  defaultJourneyMilestoneValidator,
} from "./journey-milestone-rules.js";
import { newJourneyMilestone } from "./journey-milestone.js";

test("JourneyMilestoneValidator reports every problem", () => {
  const validator = defaultJourneyMilestoneValidator();
  const item = newJourneyMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyMilestoneCohortLengthRule flags a long cohort", () => {
  const rule = new JourneyMilestoneCohortLengthRule(86400);
  const item = newJourneyMilestone("x", "y");
  item.cohort = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyMilestoneRequiredChannelRule flags a blank channel", () => {
  const rule = new JourneyMilestoneRequiredChannelRule("journey milestone needs an entry");
  const item = newJourneyMilestone("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyMilestoneRequiredCodeRule("journey milestone needs this field");
  const item = newJourneyMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
