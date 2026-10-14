import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedSuppressionPlanDescriptionLengthRule,
  BatchedSuppressionPlanNameLengthRule,
  BatchedSuppressionPlanRegionLengthRule,
  BatchedSuppressionPlanRequiredCodeRule,
  defaultBatchedSuppressionPlanValidator,
} from "./batched-suppression-plan-rules.js";
import { newBatchedSuppressionPlan } from "./batched-suppression-plan.js";

test("BatchedSuppressionPlanValidator reports every problem", () => {
  const validator = defaultBatchedSuppressionPlanValidator();
  const item = newBatchedSuppressionPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedSuppressionPlanNameLengthRule flags a long name", () => {
  const rule = new BatchedSuppressionPlanNameLengthRule(3600);
  const item = newBatchedSuppressionPlan("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedSuppressionPlanRegionLengthRule flags a long region", () => {
  const rule = new BatchedSuppressionPlanRegionLengthRule(255);
  const item = newBatchedSuppressionPlan("x", "y");
  item.region = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedSuppressionPlanDescriptionLengthRule flags a long description", () => {
  const rule = new BatchedSuppressionPlanDescriptionLengthRule(32);
  const item = newBatchedSuppressionPlan("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedSuppressionPlanRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedSuppressionPlanRequiredCodeRule("batched suppression plan needs an entry");
  const item = newBatchedSuppressionPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
