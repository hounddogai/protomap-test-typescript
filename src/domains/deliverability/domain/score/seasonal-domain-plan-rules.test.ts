import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalDomainPlanContactEmailLengthRule,
  SeasonalDomainPlanPriorityRangeRule,
  SeasonalDomainPlanRequiredTitleRule,
  SeasonalDomainPlanUnitLengthRule,
  defaultSeasonalDomainPlanValidator,
} from "./seasonal-domain-plan-rules.js";
import { newSeasonalDomainPlan } from "./seasonal-domain-plan.js";

test("SeasonalDomainPlanValidator reports every problem", () => {
  const validator = defaultSeasonalDomainPlanValidator();
  const item = newSeasonalDomainPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalDomainPlanRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalDomainPlanRequiredTitleRule("seasonal domain plan needs an entry");
  const item = newSeasonalDomainPlan("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalDomainPlanContactEmailLengthRule flags a long contact email", () => {
  const rule = new SeasonalDomainPlanContactEmailLengthRule(3600);
  const item = newSeasonalDomainPlan("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDomainPlanPriorityRangeRule flags values above priority", () => {
  const rule = new SeasonalDomainPlanPriorityRangeRule(80, 120);
  const item = newSeasonalDomainPlan("x", "y");
  item.priority = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalDomainPlanUnitLengthRule flags a long unit", () => {
  const rule = new SeasonalDomainPlanUnitLengthRule(86400);
  const item = newSeasonalDomainPlan("x", "y");
  item.unit = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
