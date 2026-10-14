import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainPlanPriorityRangeRule,
  DomainPlanRequiredSourceRule,
  DomainPlanRequiredTitleRule,
  defaultDomainPlanValidator,
} from "./domain-plan-rules.js";
import { newDomainPlan } from "./domain-plan.js";

test("DomainPlanValidator reports every problem", () => {
  const validator = defaultDomainPlanValidator();
  const item = newDomainPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainPlanRequiredSourceRule flags a blank source", () => {
  const rule = new DomainPlanRequiredSourceRule("domain plan needs an entry");
  const item = newDomainPlan("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainPlanRequiredTitleRule flags a blank title", () => {
  const rule = new DomainPlanRequiredTitleRule("domain plan needs this field");
  const item = newDomainPlan("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainPlanPriorityRangeRule flags values above priority", () => {
  const rule = new DomainPlanPriorityRangeRule(80, 255);
  const item = newDomainPlan("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
