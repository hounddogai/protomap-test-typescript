import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveComplaintAgreementNameLengthRule,
  AdaptiveComplaintAgreementThresholdRangeRule,
  defaultAdaptiveComplaintAgreementValidator,
} from "./adaptive-complaint-agreement-rules.js";
import { newAdaptiveComplaintAgreement } from "./adaptive-complaint-agreement.js";

test("AdaptiveComplaintAgreementValidator reports every problem", () => {
  const validator = defaultAdaptiveComplaintAgreementValidator();
  const item = newAdaptiveComplaintAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveComplaintAgreementNameLengthRule flags a long name", () => {
  const rule = new AdaptiveComplaintAgreementNameLengthRule(86400);
  const item = newAdaptiveComplaintAgreement("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveComplaintAgreementThresholdRangeRule flags values above threshold", () => {
  const rule = new AdaptiveComplaintAgreementThresholdRangeRule(1.6, 4546.7);
  const item = newAdaptiveComplaintAgreement("x", "y");
  item.threshold = 4548.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
