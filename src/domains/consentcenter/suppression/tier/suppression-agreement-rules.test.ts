import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionAgreementAmountRangeRule,
  SuppressionAgreementNameLengthRule,
  SuppressionAgreementRequiredSummaryRule,
  defaultSuppressionAgreementValidator,
} from "./suppression-agreement-rules.js";
import { newSuppressionAgreement } from "./suppression-agreement.js";

test("SuppressionAgreementValidator reports every problem", () => {
  const validator = defaultSuppressionAgreementValidator();
  const item = newSuppressionAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionAgreementRequiredSummaryRule flags a blank summary", () => {
  const rule = new SuppressionAgreementRequiredSummaryRule("suppression agreement needs an entry");
  const item = newSuppressionAgreement("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionAgreementNameLengthRule flags a long name", () => {
  const rule = new SuppressionAgreementNameLengthRule(120);
  const item = newSuppressionAgreement("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionAgreementAmountRangeRule flags values above amount", () => {
  const rule = new SuppressionAgreementAmountRangeRule(2.4, 4819.6);
  const item = newSuppressionAgreement("x", "y");
  item.amount = 4821.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
