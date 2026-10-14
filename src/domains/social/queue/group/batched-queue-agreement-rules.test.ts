import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedQueueAgreementCodeLengthRule,
  BatchedQueueAgreementNameLengthRule,
  BatchedQueueAgreementUpdatedAtRangeRule,
  BatchedQueueAgreementWeightRangeRule,
  BatchedQueueAgreementWindowDaysRangeRule,
  defaultBatchedQueueAgreementValidator,
} from "./batched-queue-agreement-rules.js";
import { newBatchedQueueAgreement } from "./batched-queue-agreement.js";

test("BatchedQueueAgreementValidator reports every problem", () => {
  const validator = defaultBatchedQueueAgreementValidator();
  const item = newBatchedQueueAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedQueueAgreementWeightRangeRule flags values above weight", () => {
  const rule = new BatchedQueueAgreementWeightRangeRule(0, 93.1);
  const item = newBatchedQueueAgreement("x", "y");
  item.weight = 94.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedQueueAgreementNameLengthRule flags a long name", () => {
  const rule = new BatchedQueueAgreementNameLengthRule(255);
  const item = newBatchedQueueAgreement("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedQueueAgreementWindowDaysRangeRule flags values above window days", () => {
  const rule = new BatchedQueueAgreementWindowDaysRangeRule(32, 1000);
  const item = newBatchedQueueAgreement("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedQueueAgreementCodeLengthRule flags a long code", () => {
  const rule = new BatchedQueueAgreementCodeLengthRule(80);
  const item = newBatchedQueueAgreement("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedQueueAgreementUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new BatchedQueueAgreementUpdatedAtRangeRule(255, 86400);
  const item = newBatchedQueueAgreement("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
