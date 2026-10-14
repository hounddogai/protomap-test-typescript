import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRedemptionAgreementCapacityRangeRule,
  StrictRedemptionAgreementRequiredTimezoneRule,
  StrictRedemptionAgreementSequenceRangeRule,
  StrictRedemptionAgreementTimezoneLengthRule,
  StrictRedemptionAgreementUpdatedAtRangeRule,
  defaultStrictRedemptionAgreementValidator,
} from "./strict-redemption-agreement-rules.js";
import { newStrictRedemptionAgreement } from "./strict-redemption-agreement.js";

test("StrictRedemptionAgreementValidator reports every problem", () => {
  const validator = defaultStrictRedemptionAgreementValidator();
  const item = newStrictRedemptionAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRedemptionAgreementRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new StrictRedemptionAgreementRequiredTimezoneRule("strict redemption agreement needs this field");
  const item = newStrictRedemptionAgreement("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRedemptionAgreementTimezoneLengthRule flags a long timezone", () => {
  const rule = new StrictRedemptionAgreementTimezoneLengthRule(32);
  const item = newStrictRedemptionAgreement("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRedemptionAgreementSequenceRangeRule flags values above sequence", () => {
  const rule = new StrictRedemptionAgreementSequenceRangeRule(120, 3600);
  const item = newStrictRedemptionAgreement("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictRedemptionAgreementUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new StrictRedemptionAgreementUpdatedAtRangeRule(32, 80);
  const item = newStrictRedemptionAgreement("x", "y");
  item.updatedAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictRedemptionAgreementCapacityRangeRule flags values above capacity", () => {
  const rule = new StrictRedemptionAgreementCapacityRangeRule(16, 120);
  const item = newStrictRedemptionAgreement("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
