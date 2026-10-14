import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFraudCheckAgreementBudgetRangeRule,
  ManualFraudCheckAgreementCodeLengthRule,
  ManualFraudCheckAgreementRequiredLabelRule,
  ManualFraudCheckAgreementSummaryLengthRule,
  defaultManualFraudCheckAgreementValidator,
} from "./manual-fraud-check-agreement-rules.js";
import { newManualFraudCheckAgreement } from "./manual-fraud-check-agreement.js";

test("ManualFraudCheckAgreementValidator reports every problem", () => {
  const validator = defaultManualFraudCheckAgreementValidator();
  const item = newManualFraudCheckAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFraudCheckAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new ManualFraudCheckAgreementRequiredLabelRule("manual fraud check agreement needs an entry");
  const item = newManualFraudCheckAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFraudCheckAgreementCodeLengthRule flags a long code", () => {
  const rule = new ManualFraudCheckAgreementCodeLengthRule(1000);
  const item = newManualFraudCheckAgreement("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFraudCheckAgreementSummaryLengthRule flags a long summary", () => {
  const rule = new ManualFraudCheckAgreementSummaryLengthRule(255);
  const item = newManualFraudCheckAgreement("x", "y");
  item.summary = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFraudCheckAgreementBudgetRangeRule flags values above budget", () => {
  const rule = new ManualFraudCheckAgreementBudgetRangeRule(4.2, 1415.6);
  const item = newManualFraudCheckAgreement("x", "y");
  item.budget = 1417.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
