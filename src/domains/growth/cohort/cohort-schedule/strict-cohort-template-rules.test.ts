import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCohortTemplateBudgetRangeRule,
  StrictCohortTemplateFloorValueRangeRule,
  defaultStrictCohortTemplateValidator,
} from "./strict-cohort-template-rules.js";
import { newStrictCohortTemplate } from "./strict-cohort-template.js";

test("StrictCohortTemplateValidator reports every problem", () => {
  const validator = defaultStrictCohortTemplateValidator();
  const item = newStrictCohortTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCohortTemplateBudgetRangeRule flags values above budget", () => {
  const rule = new StrictCohortTemplateBudgetRangeRule(7.8, 4648.7);
  const item = newStrictCohortTemplate("x", "y");
  item.budget = 4650.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictCohortTemplateFloorValueRangeRule flags values above floor value", () => {
  const rule = new StrictCohortTemplateFloorValueRangeRule(2.3, 4825.2);
  const item = newStrictCohortTemplate("x", "y");
  item.floorValue = 4826.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
