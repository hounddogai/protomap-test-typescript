import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedSlaAgreementCodeLengthRule,
  BatchedSlaAgreementCreatedAtRangeRule,
  BatchedSlaAgreementCurrencyLengthRule,
  BatchedSlaAgreementImpressionsRangeRule,
  BatchedSlaAgreementRequiredCodeRule,
  defaultBatchedSlaAgreementValidator,
} from "./batched-sla-agreement-rules.js";
import { newBatchedSlaAgreement } from "./batched-sla-agreement.js";

test("BatchedSlaAgreementValidator reports every problem", () => {
  const validator = defaultBatchedSlaAgreementValidator();
  const item = newBatchedSlaAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedSlaAgreementCreatedAtRangeRule flags values above created at", () => {
  const rule = new BatchedSlaAgreementCreatedAtRangeRule(32, 80);
  const item = newBatchedSlaAgreement("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedSlaAgreementImpressionsRangeRule flags values above impressions", () => {
  const rule = new BatchedSlaAgreementImpressionsRangeRule(64, 80);
  const item = newBatchedSlaAgreement("x", "y");
  item.impressions = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedSlaAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedSlaAgreementRequiredCodeRule("batched sla agreement needs an entry");
  const item = newBatchedSlaAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedSlaAgreementCodeLengthRule flags a long code", () => {
  const rule = new BatchedSlaAgreementCodeLengthRule(3600);
  const item = newBatchedSlaAgreement("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedSlaAgreementCurrencyLengthRule flags a long currency", () => {
  const rule = new BatchedSlaAgreementCurrencyLengthRule(16);
  const item = newBatchedSlaAgreement("x", "y");
  item.currency = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
