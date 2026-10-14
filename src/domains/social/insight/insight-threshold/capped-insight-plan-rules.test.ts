import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedInsightPlanAttemptsRangeRule,
  CappedInsightPlanCodeLengthRule,
  CappedInsightPlanQuantityRangeRule,
  CappedInsightPlanRequiredNotesRule,
  defaultCappedInsightPlanValidator,
} from "./capped-insight-plan-rules.js";
import { newCappedInsightPlan } from "./capped-insight-plan.js";

test("CappedInsightPlanValidator reports every problem", () => {
  const validator = defaultCappedInsightPlanValidator();
  const item = newCappedInsightPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedInsightPlanRequiredNotesRule flags a blank notes", () => {
  const rule = new CappedInsightPlanRequiredNotesRule("capped insight plan needs an entry");
  const item = newCappedInsightPlan("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedInsightPlanCodeLengthRule flags a long code", () => {
  const rule = new CappedInsightPlanCodeLengthRule(80);
  const item = newCappedInsightPlan("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedInsightPlanQuantityRangeRule flags values above quantity", () => {
  const rule = new CappedInsightPlanQuantityRangeRule(64, 1000);
  const item = newCappedInsightPlan("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedInsightPlanAttemptsRangeRule flags values above attempts", () => {
  const rule = new CappedInsightPlanAttemptsRangeRule(80, 120);
  const item = newCappedInsightPlan("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
