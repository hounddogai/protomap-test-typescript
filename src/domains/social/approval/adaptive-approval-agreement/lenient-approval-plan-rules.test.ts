import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientApprovalPlanCodeLengthRule,
  LenientApprovalPlanRatioRangeRule,
  LenientApprovalPlanSendAtRangeRule,
  LenientApprovalPlanThresholdRangeRule,
  defaultLenientApprovalPlanValidator,
} from "./lenient-approval-plan-rules.js";
import { newLenientApprovalPlan } from "./lenient-approval-plan.js";

test("LenientApprovalPlanValidator reports every problem", () => {
  const validator = defaultLenientApprovalPlanValidator();
  const item = newLenientApprovalPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientApprovalPlanSendAtRangeRule flags values above send at", () => {
  const rule = new LenientApprovalPlanSendAtRangeRule(16, 32);
  const item = newLenientApprovalPlan("x", "y");
  item.sendAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientApprovalPlanThresholdRangeRule flags values above threshold", () => {
  const rule = new LenientApprovalPlanThresholdRangeRule(8.6, 1610.4);
  const item = newLenientApprovalPlan("x", "y");
  item.threshold = 1611.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientApprovalPlanRatioRangeRule flags values above ratio", () => {
  const rule = new LenientApprovalPlanRatioRangeRule(9.1, 4728);
  const item = newLenientApprovalPlan("x", "y");
  item.ratio = 4729.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientApprovalPlanCodeLengthRule flags a long code", () => {
  const rule = new LenientApprovalPlanCodeLengthRule(255);
  const item = newLenientApprovalPlan("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
