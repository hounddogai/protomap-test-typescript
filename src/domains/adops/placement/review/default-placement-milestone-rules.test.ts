import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPlacementMilestoneJourneyIdLengthRule,
  DefaultPlacementMilestoneNameLengthRule,
  DefaultPlacementMilestoneRequiredJourneyIdRule,
  DefaultPlacementMilestoneRequiredNameRule,
  defaultDefaultPlacementMilestoneValidator,
} from "./default-placement-milestone-rules.js";
import { newDefaultPlacementMilestone } from "./default-placement-milestone.js";

test("DefaultPlacementMilestoneValidator reports every problem", () => {
  const validator = defaultDefaultPlacementMilestoneValidator();
  const item = newDefaultPlacementMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPlacementMilestoneNameLengthRule flags a long name", () => {
  const rule = new DefaultPlacementMilestoneNameLengthRule(86400);
  const item = newDefaultPlacementMilestone("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPlacementMilestoneRequiredNameRule flags a blank name", () => {
  const rule = new DefaultPlacementMilestoneRequiredNameRule("default placement milestone needs this field");
  const item = newDefaultPlacementMilestone("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPlacementMilestoneRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new DefaultPlacementMilestoneRequiredJourneyIdRule("default placement milestone needs an entry");
  const item = newDefaultPlacementMilestone("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPlacementMilestoneJourneyIdLengthRule flags a long journey id", () => {
  const rule = new DefaultPlacementMilestoneJourneyIdLengthRule(255);
  const item = newDefaultPlacementMilestone("x", "y");
  item.journeyId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
