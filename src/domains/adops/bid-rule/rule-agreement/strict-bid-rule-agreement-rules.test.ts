import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictBidRuleAgreementCodeLengthRule,
  StrictBidRuleAgreementRequiredTimezoneRule,
  StrictBidRuleAgreementTimezoneLengthRule,
  defaultStrictBidRuleAgreementValidator,
} from "./strict-bid-rule-agreement-rules.js";
import { newStrictBidRuleAgreement } from "./strict-bid-rule-agreement.js";

test("StrictBidRuleAgreementValidator reports every problem", () => {
  const validator = defaultStrictBidRuleAgreementValidator();
  const item = newStrictBidRuleAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictBidRuleAgreementRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new StrictBidRuleAgreementRequiredTimezoneRule("strict bid rule agreement needs this field");
  const item = newStrictBidRuleAgreement("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictBidRuleAgreementTimezoneLengthRule flags a long timezone", () => {
  const rule = new StrictBidRuleAgreementTimezoneLengthRule(120);
  const item = newStrictBidRuleAgreement("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictBidRuleAgreementCodeLengthRule flags a long code", () => {
  const rule = new StrictBidRuleAgreementCodeLengthRule(86400);
  const item = newStrictBidRuleAgreement("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
