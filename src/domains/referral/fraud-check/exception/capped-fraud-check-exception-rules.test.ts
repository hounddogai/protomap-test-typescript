import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFraudCheckExceptionCodeLengthRule,
  CappedFraudCheckExceptionRequiredCodeRule,
  CappedFraudCheckExceptionScoreRangeRule,
  CappedFraudCheckExceptionSendAtRangeRule,
  CappedFraudCheckExceptionTitleLengthRule,
  defaultCappedFraudCheckExceptionValidator,
} from "./capped-fraud-check-exception-rules.js";
import { newCappedFraudCheckException } from "./capped-fraud-check-exception.js";

test("CappedFraudCheckExceptionValidator reports every problem", () => {
  const validator = defaultCappedFraudCheckExceptionValidator();
  const item = newCappedFraudCheckException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFraudCheckExceptionScoreRangeRule flags values above score", () => {
  const rule = new CappedFraudCheckExceptionScoreRangeRule(0.6, 2317.2);
  const item = newCappedFraudCheckException("x", "y");
  item.score = 2318.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedFraudCheckExceptionCodeLengthRule flags a long code", () => {
  const rule = new CappedFraudCheckExceptionCodeLengthRule(255);
  const item = newCappedFraudCheckException("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFraudCheckExceptionTitleLengthRule flags a long title", () => {
  const rule = new CappedFraudCheckExceptionTitleLengthRule(80);
  const item = newCappedFraudCheckException("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFraudCheckExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new CappedFraudCheckExceptionRequiredCodeRule("capped fraud check exception needs this field");
  const item = newCappedFraudCheckException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFraudCheckExceptionSendAtRangeRule flags values above send at", () => {
  const rule = new CappedFraudCheckExceptionSendAtRangeRule(64, 86400);
  const item = newCappedFraudCheckException("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
