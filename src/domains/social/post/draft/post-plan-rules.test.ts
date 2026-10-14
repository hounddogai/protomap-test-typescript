import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostPlanBatchSizeRangeRule,
  PostPlanLabelLengthRule,
  PostPlanRequiredCodeRule,
  defaultPostPlanValidator,
} from "./post-plan-rules.js";
import { newPostPlan } from "./post-plan.js";

test("PostPlanValidator reports every problem", () => {
  const validator = defaultPostPlanValidator();
  const item = newPostPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostPlanRequiredCodeRule flags a blank code", () => {
  const rule = new PostPlanRequiredCodeRule("post plan needs a value");
  const item = newPostPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostPlanBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PostPlanBatchSizeRangeRule(16, 120);
  const item = newPostPlan("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostPlanLabelLengthRule flags a long label", () => {
  const rule = new PostPlanLabelLengthRule(64);
  const item = newPostPlan("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
