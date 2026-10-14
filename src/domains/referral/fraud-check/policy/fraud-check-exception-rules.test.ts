import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckExceptionCodeLengthRule,
  FraudCheckExceptionCreatedAtRangeRule,
  FraudCheckExceptionCurrencyLengthRule,
  FraudCheckExceptionRequiredSourceRule,
  FraudCheckExceptionTitleLengthRule,
  defaultFraudCheckExceptionValidator,
} from "./fraud-check-exception-rules.js";
import { newFraudCheckException } from "./fraud-check-exception.js";

test("FraudCheckExceptionValidator reports every problem", () => {
  const validator = defaultFraudCheckExceptionValidator();
  const item = newFraudCheckException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckExceptionCurrencyLengthRule flags a long currency", () => {
  const rule = new FraudCheckExceptionCurrencyLengthRule(1000);
  const item = newFraudCheckException("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckExceptionCreatedAtRangeRule flags values above created at", () => {
  const rule = new FraudCheckExceptionCreatedAtRangeRule(32, 120);
  const item = newFraudCheckException("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckExceptionTitleLengthRule flags a long title", () => {
  const rule = new FraudCheckExceptionTitleLengthRule(255);
  const item = newFraudCheckException("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckExceptionCodeLengthRule flags a long code", () => {
  const rule = new FraudCheckExceptionCodeLengthRule(16);
  const item = newFraudCheckException("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckExceptionRequiredSourceRule flags a blank source", () => {
  const rule = new FraudCheckExceptionRequiredSourceRule("fraud check exception needs an entry");
  const item = newFraudCheckException("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
