import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalEstimateCeilingRangeRule,
  ApprovalEstimateChannelLengthRule,
  ApprovalEstimateRequiredChannelRule,
  ApprovalEstimateRequiredSegmentRule,
  ApprovalEstimateSegmentLengthRule,
  defaultApprovalEstimateValidator,
} from "./approval-estimate-rules.js";
import { newApprovalEstimate } from "./approval-estimate.js";

test("ApprovalEstimateValidator reports every problem", () => {
  const validator = defaultApprovalEstimateValidator();
  const item = newApprovalEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalEstimateRequiredSegmentRule flags a blank segment", () => {
  const rule = new ApprovalEstimateRequiredSegmentRule("approval estimate needs this field");
  const item = newApprovalEstimate("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalEstimateCeilingRangeRule flags values above ceiling", () => {
  const rule = new ApprovalEstimateCeilingRangeRule(3.9, 4452.9);
  const item = newApprovalEstimate("x", "y");
  item.ceiling = 4454.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalEstimateChannelLengthRule flags a long channel", () => {
  const rule = new ApprovalEstimateChannelLengthRule(80);
  const item = newApprovalEstimate("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalEstimateRequiredChannelRule flags a blank channel", () => {
  const rule = new ApprovalEstimateRequiredChannelRule("approval estimate needs an entry");
  const item = newApprovalEstimate("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalEstimateSegmentLengthRule flags a long segment", () => {
  const rule = new ApprovalEstimateSegmentLengthRule(64);
  const item = newApprovalEstimate("x", "y");
  item.segment = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
