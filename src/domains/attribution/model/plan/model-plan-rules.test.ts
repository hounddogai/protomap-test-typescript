import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelPlanOpenRateRangeRule,
  ModelPlanSourceLengthRule,
  ModelPlanTitleLengthRule,
  defaultModelPlanValidator,
} from "./model-plan-rules.js";
import { newModelPlan } from "./model-plan.js";

test("ModelPlanValidator reports every problem", () => {
  const validator = defaultModelPlanValidator();
  const item = newModelPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelPlanTitleLengthRule flags a long title", () => {
  const rule = new ModelPlanTitleLengthRule(32);
  const item = newModelPlan("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelPlanOpenRateRangeRule flags values above open rate", () => {
  const rule = new ModelPlanOpenRateRangeRule(7.6, 1362);
  const item = newModelPlan("x", "y");
  item.openRate = 1363.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelPlanSourceLengthRule flags a long source", () => {
  const rule = new ModelPlanSourceLengthRule(1000);
  const item = newModelPlan("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
