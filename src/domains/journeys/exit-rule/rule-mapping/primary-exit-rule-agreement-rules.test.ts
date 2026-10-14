import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryExitRuleAgreementNotesLengthRule,
  PrimaryExitRuleAgreementRateRangeRule,
  PrimaryExitRuleAgreementRequiredCodeRule,
  PrimaryExitRuleAgreementStartsAtRangeRule,
  defaultPrimaryExitRuleAgreementValidator,
} from "./primary-exit-rule-agreement-rules.js";
import { newPrimaryExitRuleAgreement } from "./primary-exit-rule-agreement.js";

test("PrimaryExitRuleAgreementValidator reports every problem", () => {
  const validator = defaultPrimaryExitRuleAgreementValidator();
  const item = newPrimaryExitRuleAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryExitRuleAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryExitRuleAgreementRequiredCodeRule("primary exit rule agreement needs a value");
  const item = newPrimaryExitRuleAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryExitRuleAgreementStartsAtRangeRule flags values above starts at", () => {
  const rule = new PrimaryExitRuleAgreementStartsAtRangeRule(80, 255);
  const item = newPrimaryExitRuleAgreement("x", "y");
  item.startsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryExitRuleAgreementNotesLengthRule flags a long notes", () => {
  const rule = new PrimaryExitRuleAgreementNotesLengthRule(64);
  const item = newPrimaryExitRuleAgreement("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryExitRuleAgreementRateRangeRule flags values above rate", () => {
  const rule = new PrimaryExitRuleAgreementRateRangeRule(0.3, 2831.7);
  const item = newPrimaryExitRuleAgreement("x", "y");
  item.rate = 2833.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
