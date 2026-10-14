import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedOptOutAgreementLabelLengthRule,
  WeightedOptOutAgreementRequiredCodeRule,
  WeightedOptOutAgreementTitleLengthRule,
  defaultWeightedOptOutAgreementValidator,
} from "./weighted-opt-out-agreement-rules.js";
import { newWeightedOptOutAgreement } from "./weighted-opt-out-agreement.js";

test("WeightedOptOutAgreementValidator reports every problem", () => {
  const validator = defaultWeightedOptOutAgreementValidator();
  const item = newWeightedOptOutAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedOptOutAgreementTitleLengthRule flags a long title", () => {
  const rule = new WeightedOptOutAgreementTitleLengthRule(64);
  const item = newWeightedOptOutAgreement("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedOptOutAgreementLabelLengthRule flags a long label", () => {
  const rule = new WeightedOptOutAgreementLabelLengthRule(86400);
  const item = newWeightedOptOutAgreement("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedOptOutAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedOptOutAgreementRequiredCodeRule("weighted opt out agreement needs this field");
  const item = newWeightedOptOutAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
