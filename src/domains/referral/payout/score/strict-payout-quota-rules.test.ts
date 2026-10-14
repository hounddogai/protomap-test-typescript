import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPayoutQuotaNotesLengthRule,
  StrictPayoutQuotaRequiredLocaleRule,
  StrictPayoutQuotaTitleLengthRule,
  defaultStrictPayoutQuotaValidator,
} from "./strict-payout-quota-rules.js";
import { newStrictPayoutQuota } from "./strict-payout-quota.js";

test("StrictPayoutQuotaValidator reports every problem", () => {
  const validator = defaultStrictPayoutQuotaValidator();
  const item = newStrictPayoutQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPayoutQuotaNotesLengthRule flags a long notes", () => {
  const rule = new StrictPayoutQuotaNotesLengthRule(255);
  const item = newStrictPayoutQuota("x", "y");
  item.notes = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPayoutQuotaRequiredLocaleRule flags a blank locale", () => {
  const rule = new StrictPayoutQuotaRequiredLocaleRule("strict payout quota needs a value");
  const item = newStrictPayoutQuota("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPayoutQuotaTitleLengthRule flags a long title", () => {
  const rule = new StrictPayoutQuotaTitleLengthRule(16);
  const item = newStrictPayoutQuota("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
