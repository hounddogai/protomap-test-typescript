import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPreferenceMilestoneNameLengthRule,
  StrictPreferenceMilestoneRequiredTimezoneRule,
  StrictPreferenceMilestoneRequiredUnitRule,
  StrictPreferenceMilestoneUnitLengthRule,
  defaultStrictPreferenceMilestoneValidator,
} from "./strict-preference-milestone-rules.js";
import { newStrictPreferenceMilestone } from "./strict-preference-milestone.js";

test("StrictPreferenceMilestoneValidator reports every problem", () => {
  const validator = defaultStrictPreferenceMilestoneValidator();
  const item = newStrictPreferenceMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPreferenceMilestoneRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new StrictPreferenceMilestoneRequiredTimezoneRule("strict preference milestone needs an entry");
  const item = newStrictPreferenceMilestone("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPreferenceMilestoneUnitLengthRule flags a long unit", () => {
  const rule = new StrictPreferenceMilestoneUnitLengthRule(3600);
  const item = newStrictPreferenceMilestone("x", "y");
  item.unit = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPreferenceMilestoneRequiredUnitRule flags a blank unit", () => {
  const rule = new StrictPreferenceMilestoneRequiredUnitRule("strict preference milestone needs an entry");
  const item = newStrictPreferenceMilestone("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPreferenceMilestoneNameLengthRule flags a long name", () => {
  const rule = new StrictPreferenceMilestoneNameLengthRule(80);
  const item = newStrictPreferenceMilestone("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
