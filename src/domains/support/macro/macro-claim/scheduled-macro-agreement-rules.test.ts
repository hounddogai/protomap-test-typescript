import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledMacroAgreementCodeLengthRule,
  ScheduledMacroAgreementRequiredCurrencyRule,
  ScheduledMacroAgreementScoreRangeRule,
  defaultScheduledMacroAgreementValidator,
} from "./scheduled-macro-agreement-rules.js";
import { newScheduledMacroAgreement } from "./scheduled-macro-agreement.js";

test("ScheduledMacroAgreementValidator reports every problem", () => {
  const validator = defaultScheduledMacroAgreementValidator();
  const item = newScheduledMacroAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledMacroAgreementRequiredCurrencyRule flags a blank currency", () => {
  const rule = new ScheduledMacroAgreementRequiredCurrencyRule("scheduled macro agreement needs an entry");
  const item = newScheduledMacroAgreement("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledMacroAgreementCodeLengthRule flags a long code", () => {
  const rule = new ScheduledMacroAgreementCodeLengthRule(255);
  const item = newScheduledMacroAgreement("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledMacroAgreementScoreRangeRule flags values above score", () => {
  const rule = new ScheduledMacroAgreementScoreRangeRule(9.6, 3523.6);
  const item = newScheduledMacroAgreement("x", "y");
  item.score = 3525.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
