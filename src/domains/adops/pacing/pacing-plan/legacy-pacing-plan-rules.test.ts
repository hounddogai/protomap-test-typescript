import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPacingPlanCapacityRangeRule,
  LegacyPacingPlanDescriptionLengthRule,
  LegacyPacingPlanOwnerIdLengthRule,
  LegacyPacingPlanRequiredOwnerIdRule,
  defaultLegacyPacingPlanValidator,
} from "./legacy-pacing-plan-rules.js";
import { newLegacyPacingPlan } from "./legacy-pacing-plan.js";

test("LegacyPacingPlanValidator reports every problem", () => {
  const validator = defaultLegacyPacingPlanValidator();
  const item = newLegacyPacingPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPacingPlanOwnerIdLengthRule flags a long owner id", () => {
  const rule = new LegacyPacingPlanOwnerIdLengthRule(64);
  const item = newLegacyPacingPlan("x", "y");
  item.ownerId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPacingPlanCapacityRangeRule flags values above capacity", () => {
  const rule = new LegacyPacingPlanCapacityRangeRule(32, 80);
  const item = newLegacyPacingPlan("x", "y");
  item.capacity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPacingPlanRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new LegacyPacingPlanRequiredOwnerIdRule("legacy pacing plan needs an entry");
  const item = newLegacyPacingPlan("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyPacingPlanDescriptionLengthRule flags a long description", () => {
  const rule = new LegacyPacingPlanDescriptionLengthRule(80);
  const item = newLegacyPacingPlan("x", "y");
  item.description = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
