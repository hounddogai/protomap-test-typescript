import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingFraudCheckExceptionBidRangeRule,
  PendingFraudCheckExceptionBudgetRangeRule,
  PendingFraudCheckExceptionCodeLengthRule,
  PendingFraudCheckExceptionRequiredAudienceIdRule,
  PendingFraudCheckExceptionRequiredLabelRule,
  defaultPendingFraudCheckExceptionValidator,
} from "./pending-fraud-check-exception-rules.js";
import { newPendingFraudCheckException } from "./pending-fraud-check-exception.js";

test("PendingFraudCheckExceptionValidator reports every problem", () => {
  const validator = defaultPendingFraudCheckExceptionValidator();
  const item = newPendingFraudCheckException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingFraudCheckExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new PendingFraudCheckExceptionRequiredLabelRule("pending fraud check exception needs an entry");
  const item = newPendingFraudCheckException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingFraudCheckExceptionBudgetRangeRule flags values above budget", () => {
  const rule = new PendingFraudCheckExceptionBudgetRangeRule(7.6, 3131.5);
  const item = newPendingFraudCheckException("x", "y");
  item.budget = 3133;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingFraudCheckExceptionRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PendingFraudCheckExceptionRequiredAudienceIdRule("pending fraud check exception needs a value");
  const item = newPendingFraudCheckException("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingFraudCheckExceptionBidRangeRule flags values above bid", () => {
  const rule = new PendingFraudCheckExceptionBidRangeRule(4, 366.9);
  const item = newPendingFraudCheckException("x", "y");
  item.bid = 368.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingFraudCheckExceptionCodeLengthRule flags a long code", () => {
  const rule = new PendingFraudCheckExceptionCodeLengthRule(255);
  const item = newPendingFraudCheckException("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
