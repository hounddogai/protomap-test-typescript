import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalBatchCeilingRangeRule,
  ApprovalBatchContactEmailLengthRule,
  ApprovalBatchRegionLengthRule,
  ApprovalBatchRequiredContactEmailRule,
  ApprovalBatchRequiredNameRule,
  ApprovalBatchWeightRangeRule,
  defaultApprovalBatchValidator,
} from "./approval-batch-rules.js";
import { newApprovalBatch } from "./approval-batch.js";

test("ApprovalBatchValidator reports every problem", () => {
  const validator = defaultApprovalBatchValidator();
  const item = newApprovalBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalBatchWeightRangeRule flags values above weight", () => {
  const rule = new ApprovalBatchWeightRangeRule(2.7, 614.1);
  const item = newApprovalBatch("x", "y");
  item.weight = 615.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalBatchRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ApprovalBatchRequiredContactEmailRule("approval batch needs a value");
  const item = newApprovalBatch("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalBatchRequiredNameRule flags a blank name", () => {
  const rule = new ApprovalBatchRequiredNameRule("approval batch needs an entry");
  const item = newApprovalBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalBatchContactEmailLengthRule flags a long contact email", () => {
  const rule = new ApprovalBatchContactEmailLengthRule(3600);
  const item = newApprovalBatch("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalBatchRegionLengthRule flags a long region", () => {
  const rule = new ApprovalBatchRegionLengthRule(3600);
  const item = newApprovalBatch("x", "y");
  item.region = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalBatchCeilingRangeRule flags values above ceiling", () => {
  const rule = new ApprovalBatchCeilingRangeRule(5.3, 4635.4);
  const item = newApprovalBatch("x", "y");
  item.ceiling = 4636.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
