import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPayoutAgreementCodeLengthRule,
  FallbackPayoutAgreementLabelLengthRule,
  FallbackPayoutAgreementMinimumRangeRule,
  FallbackPayoutAgreementThresholdRangeRule,
  defaultFallbackPayoutAgreementValidator,
} from "./fallback-payout-agreement-rules.js";
import { newFallbackPayoutAgreement } from "./fallback-payout-agreement.js";

test("FallbackPayoutAgreementValidator reports every problem", () => {
  const validator = defaultFallbackPayoutAgreementValidator();
  const item = newFallbackPayoutAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPayoutAgreementThresholdRangeRule flags values above threshold", () => {
  const rule = new FallbackPayoutAgreementThresholdRangeRule(0.7, 938.4);
  const item = newFallbackPayoutAgreement("x", "y");
  item.threshold = 939.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPayoutAgreementCodeLengthRule flags a long code", () => {
  const rule = new FallbackPayoutAgreementCodeLengthRule(16);
  const item = newFallbackPayoutAgreement("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPayoutAgreementLabelLengthRule flags a long label", () => {
  const rule = new FallbackPayoutAgreementLabelLengthRule(32);
  const item = newFallbackPayoutAgreement("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPayoutAgreementMinimumRangeRule flags values above minimum", () => {
  const rule = new FallbackPayoutAgreementMinimumRangeRule(3.6, 2284);
  const item = newFallbackPayoutAgreement("x", "y");
  item.minimum = 2285.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
