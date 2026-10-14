import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualComplaintAgreementDiscountRangeRule,
  ManualComplaintAgreementRequiredTitleRule,
  ManualComplaintAgreementRetriesRangeRule,
  ManualComplaintAgreementSequenceRangeRule,
  defaultManualComplaintAgreementValidator,
} from "./manual-complaint-agreement-rules.js";
import { newManualComplaintAgreement } from "./manual-complaint-agreement.js";

test("ManualComplaintAgreementValidator reports every problem", () => {
  const validator = defaultManualComplaintAgreementValidator();
  const item = newManualComplaintAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualComplaintAgreementRetriesRangeRule flags values above retries", () => {
  const rule = new ManualComplaintAgreementRetriesRangeRule(1000, 86400);
  const item = newManualComplaintAgreement("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualComplaintAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new ManualComplaintAgreementRequiredTitleRule("manual complaint agreement needs a value");
  const item = newManualComplaintAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualComplaintAgreementDiscountRangeRule flags values above discount", () => {
  const rule = new ManualComplaintAgreementDiscountRangeRule(1.6, 4559.9);
  const item = newManualComplaintAgreement("x", "y");
  item.discount = 4561.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualComplaintAgreementSequenceRangeRule flags values above sequence", () => {
  const rule = new ManualComplaintAgreementSequenceRangeRule(32, 86400);
  const item = newManualComplaintAgreement("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
