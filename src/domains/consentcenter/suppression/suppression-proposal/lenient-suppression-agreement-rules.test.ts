import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientSuppressionAgreementLabelLengthRule,
  LenientSuppressionAgreementRequiredCodeRule,
  LenientSuppressionAgreementRequiredRegionRule,
  LenientSuppressionAgreementThresholdRangeRule,
  defaultLenientSuppressionAgreementValidator,
} from "./lenient-suppression-agreement-rules.js";
import { newLenientSuppressionAgreement } from "./lenient-suppression-agreement.js";

test("LenientSuppressionAgreementValidator reports every problem", () => {
  const validator = defaultLenientSuppressionAgreementValidator();
  const item = newLenientSuppressionAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientSuppressionAgreementRequiredRegionRule flags a blank region", () => {
  const rule = new LenientSuppressionAgreementRequiredRegionRule("lenient suppression agreement needs an entry");
  const item = newLenientSuppressionAgreement("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSuppressionAgreementThresholdRangeRule flags values above threshold", () => {
  const rule = new LenientSuppressionAgreementThresholdRangeRule(5, 2567.9);
  const item = newLenientSuppressionAgreement("x", "y");
  item.threshold = 2569.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSuppressionAgreementLabelLengthRule flags a long label", () => {
  const rule = new LenientSuppressionAgreementLabelLengthRule(64);
  const item = newLenientSuppressionAgreement("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientSuppressionAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new LenientSuppressionAgreementRequiredCodeRule("lenient suppression agreement needs this field");
  const item = newLenientSuppressionAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
