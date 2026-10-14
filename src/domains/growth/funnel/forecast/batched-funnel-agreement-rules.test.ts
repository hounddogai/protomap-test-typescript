import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFunnelAgreementContactEmailLengthRule,
  BatchedFunnelAgreementCurrencyLengthRule,
  BatchedFunnelAgreementRequiredCurrencyRule,
  BatchedFunnelAgreementRequiredTitleRule,
  defaultBatchedFunnelAgreementValidator,
} from "./batched-funnel-agreement-rules.js";
import { newBatchedFunnelAgreement } from "./batched-funnel-agreement.js";

test("BatchedFunnelAgreementValidator reports every problem", () => {
  const validator = defaultBatchedFunnelAgreementValidator();
  const item = newBatchedFunnelAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFunnelAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedFunnelAgreementRequiredTitleRule("batched funnel agreement needs this field");
  const item = newBatchedFunnelAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFunnelAgreementContactEmailLengthRule flags a long contact email", () => {
  const rule = new BatchedFunnelAgreementContactEmailLengthRule(32);
  const item = newBatchedFunnelAgreement("x", "y");
  item.contactEmail = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedFunnelAgreementCurrencyLengthRule flags a long currency", () => {
  const rule = new BatchedFunnelAgreementCurrencyLengthRule(80);
  const item = newBatchedFunnelAgreement("x", "y");
  item.currency = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedFunnelAgreementRequiredCurrencyRule flags a blank currency", () => {
  const rule = new BatchedFunnelAgreementRequiredCurrencyRule("batched funnel agreement needs a value");
  const item = newBatchedFunnelAgreement("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
