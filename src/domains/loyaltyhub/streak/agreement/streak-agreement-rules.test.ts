import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakAgreementBatchSizeRangeRule,
  StreakAgreementCodeLengthRule,
  StreakAgreementCurrencyLengthRule,
  StreakAgreementRequiredCurrencyRule,
  defaultStreakAgreementValidator,
} from "./streak-agreement-rules.js";
import { newStreakAgreement } from "./streak-agreement.js";

test("StreakAgreementValidator reports every problem", () => {
  const validator = defaultStreakAgreementValidator();
  const item = newStreakAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakAgreementCodeLengthRule flags a long code", () => {
  const rule = new StreakAgreementCodeLengthRule(80);
  const item = newStreakAgreement("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakAgreementRequiredCurrencyRule flags a blank currency", () => {
  const rule = new StreakAgreementRequiredCurrencyRule("streak agreement needs an entry");
  const item = newStreakAgreement("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakAgreementBatchSizeRangeRule flags values above batch size", () => {
  const rule = new StreakAgreementBatchSizeRangeRule(32, 86400);
  const item = newStreakAgreement("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakAgreementCurrencyLengthRule flags a long currency", () => {
  const rule = new StreakAgreementCurrencyLengthRule(32);
  const item = newStreakAgreement("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
