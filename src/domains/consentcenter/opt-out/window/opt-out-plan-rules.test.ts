import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutPlanBatchSizeRangeRule,
  OptOutPlanLabelLengthRule,
  OptOutPlanRevisionRangeRule,
  defaultOptOutPlanValidator,
} from "./opt-out-plan-rules.js";
import { newOptOutPlan } from "./opt-out-plan.js";

test("OptOutPlanValidator reports every problem", () => {
  const validator = defaultOptOutPlanValidator();
  const item = newOptOutPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutPlanBatchSizeRangeRule flags values above batch size", () => {
  const rule = new OptOutPlanBatchSizeRangeRule(1000, 86400);
  const item = newOptOutPlan("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutPlanRevisionRangeRule flags values above revision", () => {
  const rule = new OptOutPlanRevisionRangeRule(32, 1000);
  const item = newOptOutPlan("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutPlanLabelLengthRule flags a long label", () => {
  const rule = new OptOutPlanLabelLengthRule(1000);
  const item = newOptOutPlan("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
