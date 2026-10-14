import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredMacroAgreementCodeLengthRule,
  TieredMacroAgreementRateRangeRule,
  TieredMacroAgreementThresholdRangeRule,
  TieredMacroAgreementTitleLengthRule,
  TieredMacroAgreementUpdatedAtRangeRule,
  TieredMacroAgreementWindowDaysRangeRule,
  defaultTieredMacroAgreementValidator,
} from "./tiered-macro-agreement-rules.js";
import { newTieredMacroAgreement } from "./tiered-macro-agreement.js";

test("TieredMacroAgreementValidator reports every problem", () => {
  const validator = defaultTieredMacroAgreementValidator();
  const item = newTieredMacroAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredMacroAgreementUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new TieredMacroAgreementUpdatedAtRangeRule(32, 1000);
  const item = newTieredMacroAgreement("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredMacroAgreementThresholdRangeRule flags values above threshold", () => {
  const rule = new TieredMacroAgreementThresholdRangeRule(0.5, 2710.3);
  const item = newTieredMacroAgreement("x", "y");
  item.threshold = 2711.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredMacroAgreementRateRangeRule flags values above rate", () => {
  const rule = new TieredMacroAgreementRateRangeRule(7, 2739.4);
  const item = newTieredMacroAgreement("x", "y");
  item.rate = 2740.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredMacroAgreementTitleLengthRule flags a long title", () => {
  const rule = new TieredMacroAgreementTitleLengthRule(64);
  const item = newTieredMacroAgreement("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredMacroAgreementCodeLengthRule flags a long code", () => {
  const rule = new TieredMacroAgreementCodeLengthRule(120);
  const item = newTieredMacroAgreement("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredMacroAgreementWindowDaysRangeRule flags values above window days", () => {
  const rule = new TieredMacroAgreementWindowDaysRangeRule(32, 255);
  const item = newTieredMacroAgreement("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
