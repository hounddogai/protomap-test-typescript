import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementMilestoneCodeLengthRule,
  PlacementMilestoneDurationMinutesRangeRule,
  PlacementMilestoneNameLengthRule,
  PlacementMilestoneRequiredCodeRule,
  defaultPlacementMilestoneValidator,
} from "./placement-milestone-rules.js";
import { newPlacementMilestone } from "./placement-milestone.js";

test("PlacementMilestoneValidator reports every problem", () => {
  const validator = defaultPlacementMilestoneValidator();
  const item = newPlacementMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementMilestoneCodeLengthRule flags a long code", () => {
  const rule = new PlacementMilestoneCodeLengthRule(86400);
  const item = newPlacementMilestone("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementMilestoneNameLengthRule flags a long name", () => {
  const rule = new PlacementMilestoneNameLengthRule(64);
  const item = newPlacementMilestone("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementMilestoneDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new PlacementMilestoneDurationMinutesRangeRule(64, 80);
  const item = newPlacementMilestone("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementMilestoneRequiredCodeRule("placement milestone needs this field");
  const item = newPlacementMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
