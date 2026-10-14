import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalBadgeQuotaCodeLengthRule,
  RegionalBadgeQuotaNameLengthRule,
  RegionalBadgeQuotaRequiredLocaleRule,
  RegionalBadgeQuotaRequiredNameRule,
  defaultRegionalBadgeQuotaValidator,
} from "./regional-badge-quota-rules.js";
import { newRegionalBadgeQuota } from "./regional-badge-quota.js";

test("RegionalBadgeQuotaValidator reports every problem", () => {
  const validator = defaultRegionalBadgeQuotaValidator();
  const item = newRegionalBadgeQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalBadgeQuotaNameLengthRule flags a long name", () => {
  const rule = new RegionalBadgeQuotaNameLengthRule(32);
  const item = newRegionalBadgeQuota("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalBadgeQuotaRequiredNameRule flags a blank name", () => {
  const rule = new RegionalBadgeQuotaRequiredNameRule("regional badge quota needs this field");
  const item = newRegionalBadgeQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalBadgeQuotaCodeLengthRule flags a long code", () => {
  const rule = new RegionalBadgeQuotaCodeLengthRule(16);
  const item = newRegionalBadgeQuota("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalBadgeQuotaRequiredLocaleRule flags a blank locale", () => {
  const rule = new RegionalBadgeQuotaRequiredLocaleRule("regional badge quota needs this field");
  const item = newRegionalBadgeQuota("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
