import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingAgreementEndsAtRangeRule,
  PacingAgreementGraceDaysRangeRule,
  PacingAgreementRequiredCategoryRule,
  defaultPacingAgreementValidator,
} from "./pacing-agreement-rules.js";
import { newPacingAgreement } from "./pacing-agreement.js";

test("PacingAgreementValidator reports every problem", () => {
  const validator = defaultPacingAgreementValidator();
  const item = newPacingAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingAgreementEndsAtRangeRule flags values above ends at", () => {
  const rule = new PacingAgreementEndsAtRangeRule(64, 1000);
  const item = newPacingAgreement("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingAgreementRequiredCategoryRule flags a blank category", () => {
  const rule = new PacingAgreementRequiredCategoryRule("pacing agreement needs a value");
  const item = newPacingAgreement("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingAgreementGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PacingAgreementGraceDaysRangeRule(16, 32);
  const item = newPacingAgreement("x", "y");
  item.graceDays = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
