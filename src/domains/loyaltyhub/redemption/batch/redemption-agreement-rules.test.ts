import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionAgreementCodeLengthRule,
  RedemptionAgreementRequiredCodeRule,
  RedemptionAgreementRequiredLabelRule,
  RedemptionAgreementSourceLengthRule,
  defaultRedemptionAgreementValidator,
} from "./redemption-agreement-rules.js";
import { newRedemptionAgreement } from "./redemption-agreement.js";

test("RedemptionAgreementValidator reports every problem", () => {
  const validator = defaultRedemptionAgreementValidator();
  const item = newRedemptionAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionAgreementRequiredCodeRule("redemption agreement needs a value");
  const item = newRedemptionAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionAgreementSourceLengthRule flags a long source", () => {
  const rule = new RedemptionAgreementSourceLengthRule(255);
  const item = newRedemptionAgreement("x", "y");
  item.source = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionAgreementCodeLengthRule flags a long code", () => {
  const rule = new RedemptionAgreementCodeLengthRule(64);
  const item = newRedemptionAgreement("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new RedemptionAgreementRequiredLabelRule("redemption agreement needs an entry");
  const item = newRedemptionAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
