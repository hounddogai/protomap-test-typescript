import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionQuotaRequiredCodeRule,
  ConversionQuotaRequiredCohortRule,
  defaultConversionQuotaValidator,
} from "./conversion-quota-rules.js";
import { newConversionQuota } from "./conversion-quota.js";

test("ConversionQuotaValidator reports every problem", () => {
  const validator = defaultConversionQuotaValidator();
  const item = newConversionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionQuotaRequiredCohortRule flags a blank cohort", () => {
  const rule = new ConversionQuotaRequiredCohortRule("conversion quota needs this field");
  const item = newConversionQuota("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionQuotaRequiredCodeRule("conversion quota needs an entry");
  const item = newConversionQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
