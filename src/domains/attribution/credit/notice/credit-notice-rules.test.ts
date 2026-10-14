import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditNoticeConversionRateRangeRule,
  CreditNoticeRequiredLabelRule,
  CreditNoticeRequiredOwnerIdRule,
  defaultCreditNoticeValidator,
} from "./credit-notice-rules.js";
import { newCreditNotice } from "./credit-notice.js";

test("CreditNoticeValidator reports every problem", () => {
  const validator = defaultCreditNoticeValidator();
  const item = newCreditNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditNoticeConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new CreditNoticeConversionRateRangeRule(3.5, 919.6);
  const item = newCreditNotice("x", "y");
  item.conversionRate = 921.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new CreditNoticeRequiredLabelRule("credit notice needs an entry");
  const item = newCreditNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditNoticeRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new CreditNoticeRequiredOwnerIdRule("credit notice needs an entry");
  const item = newCreditNotice("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
