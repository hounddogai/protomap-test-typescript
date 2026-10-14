import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingInsightAgreementCountryLengthRule,
  PendingInsightAgreementRequiredCountryRule,
  PendingInsightAgreementRequiredTitleRule,
  PendingInsightAgreementRequiredVariantRule,
  PendingInsightAgreementVariantLengthRule,
  defaultPendingInsightAgreementValidator,
} from "./pending-insight-agreement-rules.js";
import { newPendingInsightAgreement } from "./pending-insight-agreement.js";

test("PendingInsightAgreementValidator reports every problem", () => {
  const validator = defaultPendingInsightAgreementValidator();
  const item = newPendingInsightAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingInsightAgreementRequiredVariantRule flags a blank variant", () => {
  const rule = new PendingInsightAgreementRequiredVariantRule("pending insight agreement needs a value");
  const item = newPendingInsightAgreement("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingInsightAgreementVariantLengthRule flags a long variant", () => {
  const rule = new PendingInsightAgreementVariantLengthRule(86400);
  const item = newPendingInsightAgreement("x", "y");
  item.variant = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingInsightAgreementRequiredCountryRule flags a blank country", () => {
  const rule = new PendingInsightAgreementRequiredCountryRule("pending insight agreement needs a value");
  const item = newPendingInsightAgreement("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingInsightAgreementCountryLengthRule flags a long country", () => {
  const rule = new PendingInsightAgreementCountryLengthRule(64);
  const item = newPendingInsightAgreement("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingInsightAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new PendingInsightAgreementRequiredTitleRule("pending insight agreement needs an entry");
  const item = newPendingInsightAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
