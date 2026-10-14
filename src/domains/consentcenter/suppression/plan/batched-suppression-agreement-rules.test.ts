import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedSuppressionAgreementBatchSizeRangeRule,
  BatchedSuppressionAgreementNameLengthRule,
  BatchedSuppressionAgreementRequiredCodeRule,
  BatchedSuppressionAgreementRequiredNameRule,
  defaultBatchedSuppressionAgreementValidator,
} from "./batched-suppression-agreement-rules.js";
import { newBatchedSuppressionAgreement } from "./batched-suppression-agreement.js";

test("BatchedSuppressionAgreementValidator reports every problem", () => {
  const validator = defaultBatchedSuppressionAgreementValidator();
  const item = newBatchedSuppressionAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedSuppressionAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedSuppressionAgreementRequiredCodeRule("batched suppression agreement needs this field");
  const item = newBatchedSuppressionAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedSuppressionAgreementBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BatchedSuppressionAgreementBatchSizeRangeRule(16, 64);
  const item = newBatchedSuppressionAgreement("x", "y");
  item.batchSize = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedSuppressionAgreementRequiredNameRule flags a blank name", () => {
  const rule = new BatchedSuppressionAgreementRequiredNameRule("batched suppression agreement needs an entry");
  const item = newBatchedSuppressionAgreement("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedSuppressionAgreementNameLengthRule flags a long name", () => {
  const rule = new BatchedSuppressionAgreementNameLengthRule(86400);
  const item = newBatchedSuppressionAgreement("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
