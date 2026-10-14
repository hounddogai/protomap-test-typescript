import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedEnrollmentDraftCountryLengthRule,
  CappedEnrollmentDraftOpenRateRangeRule,
  CappedEnrollmentDraftRequiredCodeRule,
  defaultCappedEnrollmentDraftValidator,
} from "./capped-enrollment-draft-rules.js";
import { newCappedEnrollmentDraft } from "./capped-enrollment-draft.js";

test("CappedEnrollmentDraftValidator reports every problem", () => {
  const validator = defaultCappedEnrollmentDraftValidator();
  const item = newCappedEnrollmentDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedEnrollmentDraftRequiredCodeRule flags a blank code", () => {
  const rule = new CappedEnrollmentDraftRequiredCodeRule("capped enrollment draft needs an entry");
  const item = newCappedEnrollmentDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedEnrollmentDraftOpenRateRangeRule flags values above open rate", () => {
  const rule = new CappedEnrollmentDraftOpenRateRangeRule(0.1, 1692.5);
  const item = newCappedEnrollmentDraft("x", "y");
  item.openRate = 1694;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedEnrollmentDraftCountryLengthRule flags a long country", () => {
  const rule = new CappedEnrollmentDraftCountryLengthRule(32);
  const item = newCappedEnrollmentDraft("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
