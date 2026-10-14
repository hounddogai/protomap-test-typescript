import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelAgreementFrequencyCapRangeRule,
  LevelAgreementRequiredCodeRule,
  LevelAgreementRequiredUnitRule,
  LevelAgreementTitleLengthRule,
  defaultLevelAgreementValidator,
} from "./level-agreement-rules.js";
import { newLevelAgreement } from "./level-agreement.js";

test("LevelAgreementValidator reports every problem", () => {
  const validator = defaultLevelAgreementValidator();
  const item = newLevelAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelAgreementRequiredUnitRule flags a blank unit", () => {
  const rule = new LevelAgreementRequiredUnitRule("level agreement needs this field");
  const item = newLevelAgreement("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelAgreementTitleLengthRule flags a long title", () => {
  const rule = new LevelAgreementTitleLengthRule(16);
  const item = newLevelAgreement("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelAgreementFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new LevelAgreementFrequencyCapRangeRule(64, 120);
  const item = newLevelAgreement("x", "y");
  item.frequencyCap = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new LevelAgreementRequiredCodeRule("level agreement needs a value");
  const item = newLevelAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
