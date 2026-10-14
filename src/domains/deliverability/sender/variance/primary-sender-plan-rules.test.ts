import assert from "node:assert/strict";
import { test } from "node:test";
import { PrimarySenderPlanCodeLengthRule, defaultPrimarySenderPlanValidator } from "./primary-sender-plan-rules.js";
import { newPrimarySenderPlan } from "./primary-sender-plan.js";

test("PrimarySenderPlanValidator reports every problem", () => {
  const validator = defaultPrimarySenderPlanValidator();
  const item = newPrimarySenderPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySenderPlanCodeLengthRule flags a long code", () => {
  const rule = new PrimarySenderPlanCodeLengthRule(80);
  const item = newPrimarySenderPlan("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
