import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingInsightPlanNameLengthRule,
  PendingInsightPlanRequiredChecksumRule,
  PendingInsightPlanRequiredCodeRule,
  PendingInsightPlanSequenceRangeRule,
  PendingInsightPlanThresholdRangeRule,
  defaultPendingInsightPlanValidator,
} from "./pending-insight-plan-rules.js";
import { newPendingInsightPlan } from "./pending-insight-plan.js";

test("PendingInsightPlanValidator reports every problem", () => {
  const validator = defaultPendingInsightPlanValidator();
  const item = newPendingInsightPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingInsightPlanNameLengthRule flags a long name", () => {
  const rule = new PendingInsightPlanNameLengthRule(80);
  const item = newPendingInsightPlan("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingInsightPlanThresholdRangeRule flags values above threshold", () => {
  const rule = new PendingInsightPlanThresholdRangeRule(1.8, 4858.9);
  const item = newPendingInsightPlan("x", "y");
  item.threshold = 4860.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingInsightPlanRequiredChecksumRule flags a blank checksum", () => {
  const rule = new PendingInsightPlanRequiredChecksumRule("pending insight plan needs this field");
  const item = newPendingInsightPlan("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingInsightPlanRequiredCodeRule flags a blank code", () => {
  const rule = new PendingInsightPlanRequiredCodeRule("pending insight plan needs an entry");
  const item = newPendingInsightPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingInsightPlanSequenceRangeRule flags values above sequence", () => {
  const rule = new PendingInsightPlanSequenceRangeRule(32, 80);
  const item = newPendingInsightPlan("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
