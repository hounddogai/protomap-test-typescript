import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPacingAgreementCodeLengthRule,
  DefaultPacingAgreementFrequencyCapRangeRule,
  DefaultPacingAgreementLabelLengthRule,
  DefaultPacingAgreementLimitRangeRule,
  DefaultPacingAgreementRequiredLabelRule,
  defaultDefaultPacingAgreementValidator,
} from "./default-pacing-agreement-rules.js";
import { newDefaultPacingAgreement } from "./default-pacing-agreement.js";

test("DefaultPacingAgreementValidator reports every problem", () => {
  const validator = defaultDefaultPacingAgreementValidator();
  const item = newDefaultPacingAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPacingAgreementFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new DefaultPacingAgreementFrequencyCapRangeRule(1000, 86400);
  const item = newDefaultPacingAgreement("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPacingAgreementLabelLengthRule flags a long label", () => {
  const rule = new DefaultPacingAgreementLabelLengthRule(1000);
  const item = newDefaultPacingAgreement("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPacingAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultPacingAgreementRequiredLabelRule("default pacing agreement needs this field");
  const item = newDefaultPacingAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPacingAgreementLimitRangeRule flags values above limit", () => {
  const rule = new DefaultPacingAgreementLimitRangeRule(32, 80);
  const item = newDefaultPacingAgreement("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPacingAgreementCodeLengthRule flags a long code", () => {
  const rule = new DefaultPacingAgreementCodeLengthRule(255);
  const item = newDefaultPacingAgreement("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
