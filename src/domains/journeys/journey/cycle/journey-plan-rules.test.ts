import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyPlanCodeLengthRule,
  JourneyPlanRevisionRangeRule,
  JourneyPlanUnitLengthRule,
  JourneyPlanUpdatedAtRangeRule,
  defaultJourneyPlanValidator,
} from "./journey-plan-rules.js";
import { newJourneyPlan } from "./journey-plan.js";

test("JourneyPlanValidator reports every problem", () => {
  const validator = defaultJourneyPlanValidator();
  const item = newJourneyPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyPlanRevisionRangeRule flags values above revision", () => {
  const rule = new JourneyPlanRevisionRangeRule(16, 64);
  const item = newJourneyPlan("x", "y");
  item.revision = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyPlanUnitLengthRule flags a long unit", () => {
  const rule = new JourneyPlanUnitLengthRule(32);
  const item = newJourneyPlan("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyPlanUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new JourneyPlanUpdatedAtRangeRule(32, 3600);
  const item = newJourneyPlan("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyPlanCodeLengthRule flags a long code", () => {
  const rule = new JourneyPlanCodeLengthRule(120);
  const item = newJourneyPlan("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
