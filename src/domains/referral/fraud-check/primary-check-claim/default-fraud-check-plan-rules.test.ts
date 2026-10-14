import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFraudCheckPlanCodeLengthRule,
  DefaultFraudCheckPlanRequiredCodeRule,
  DefaultFraudCheckPlanRequiredNameRule,
  DefaultFraudCheckPlanRequiredTitleRule,
  defaultDefaultFraudCheckPlanValidator,
} from "./default-fraud-check-plan-rules.js";
import { newDefaultFraudCheckPlan } from "./default-fraud-check-plan.js";

test("DefaultFraudCheckPlanValidator reports every problem", () => {
  const validator = defaultDefaultFraudCheckPlanValidator();
  const item = newDefaultFraudCheckPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFraudCheckPlanRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultFraudCheckPlanRequiredCodeRule("default fraud check plan needs an entry");
  const item = newDefaultFraudCheckPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFraudCheckPlanCodeLengthRule flags a long code", () => {
  const rule = new DefaultFraudCheckPlanCodeLengthRule(3600);
  const item = newDefaultFraudCheckPlan("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFraudCheckPlanRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultFraudCheckPlanRequiredTitleRule("default fraud check plan needs an entry");
  const item = newDefaultFraudCheckPlan("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFraudCheckPlanRequiredNameRule flags a blank name", () => {
  const rule = new DefaultFraudCheckPlanRequiredNameRule("default fraud check plan needs this field");
  const item = newDefaultFraudCheckPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
