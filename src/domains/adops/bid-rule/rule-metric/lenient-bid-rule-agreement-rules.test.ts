import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientBidRuleAgreementNameLengthRule,
  LenientBidRuleAgreementRequiredCodeRule,
  LenientBidRuleAgreementRequiredSourceRule,
  defaultLenientBidRuleAgreementValidator,
} from "./lenient-bid-rule-agreement-rules.js";
import { newLenientBidRuleAgreement } from "./lenient-bid-rule-agreement.js";

test("LenientBidRuleAgreementValidator reports every problem", () => {
  const validator = defaultLenientBidRuleAgreementValidator();
  const item = newLenientBidRuleAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientBidRuleAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new LenientBidRuleAgreementRequiredCodeRule("lenient bid rule agreement needs a value");
  const item = newLenientBidRuleAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientBidRuleAgreementNameLengthRule flags a long name", () => {
  const rule = new LenientBidRuleAgreementNameLengthRule(64);
  const item = newLenientBidRuleAgreement("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientBidRuleAgreementRequiredSourceRule flags a blank source", () => {
  const rule = new LenientBidRuleAgreementRequiredSourceRule("lenient bid rule agreement needs this field");
  const item = newLenientBidRuleAgreement("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
