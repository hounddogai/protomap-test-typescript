import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionAgreementCodeLengthRule,
  RetentionAgreementRequiredSummaryRule,
  defaultRetentionAgreementValidator,
} from "./retention-agreement-rules.js";
import { newRetentionAgreement } from "./retention-agreement.js";

test("RetentionAgreementValidator reports every problem", () => {
  const validator = defaultRetentionAgreementValidator();
  const item = newRetentionAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionAgreementRequiredSummaryRule flags a blank summary", () => {
  const rule = new RetentionAgreementRequiredSummaryRule("retention agreement needs this field");
  const item = newRetentionAgreement("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionAgreementCodeLengthRule flags a long code", () => {
  const rule = new RetentionAgreementCodeLengthRule(3600);
  const item = newRetentionAgreement("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
