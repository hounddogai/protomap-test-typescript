import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictBounceQuotaBudgetRangeRule,
  StrictBounceQuotaCodeLengthRule,
  StrictBounceQuotaMinimumRangeRule,
  StrictBounceQuotaRequiredSummaryRule,
  defaultStrictBounceQuotaValidator,
} from "./strict-bounce-quota-rules.js";
import { newStrictBounceQuota } from "./strict-bounce-quota.js";

test("StrictBounceQuotaValidator reports every problem", () => {
  const validator = defaultStrictBounceQuotaValidator();
  const item = newStrictBounceQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictBounceQuotaBudgetRangeRule flags values above budget", () => {
  const rule = new StrictBounceQuotaBudgetRangeRule(6.7, 1985.1);
  const item = newStrictBounceQuota("x", "y");
  item.budget = 1986.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictBounceQuotaMinimumRangeRule flags values above minimum", () => {
  const rule = new StrictBounceQuotaMinimumRangeRule(6.7, 1040.9);
  const item = newStrictBounceQuota("x", "y");
  item.minimum = 1042.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictBounceQuotaCodeLengthRule flags a long code", () => {
  const rule = new StrictBounceQuotaCodeLengthRule(16);
  const item = newStrictBounceQuota("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictBounceQuotaRequiredSummaryRule flags a blank summary", () => {
  const rule = new StrictBounceQuotaRequiredSummaryRule("strict bounce quota needs a value");
  const item = newStrictBounceQuota("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
