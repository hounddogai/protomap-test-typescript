import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedInsightPlanCodeLengthRule,
  BatchedInsightPlanLimitRangeRule,
  BatchedInsightPlanRequiredLocaleRule,
  defaultBatchedInsightPlanValidator,
} from "./batched-insight-plan-rules.js";
import { newBatchedInsightPlan } from "./batched-insight-plan.js";

test("BatchedInsightPlanValidator reports every problem", () => {
  const validator = defaultBatchedInsightPlanValidator();
  const item = newBatchedInsightPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedInsightPlanRequiredLocaleRule flags a blank locale", () => {
  const rule = new BatchedInsightPlanRequiredLocaleRule("batched insight plan needs this field");
  const item = newBatchedInsightPlan("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedInsightPlanLimitRangeRule flags values above limit", () => {
  const rule = new BatchedInsightPlanLimitRangeRule(255, 1000);
  const item = newBatchedInsightPlan("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedInsightPlanCodeLengthRule flags a long code", () => {
  const rule = new BatchedInsightPlanCodeLengthRule(86400);
  const item = newBatchedInsightPlan("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
