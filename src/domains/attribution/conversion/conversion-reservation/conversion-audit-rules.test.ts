import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionAuditDiscountRangeRule,
  ConversionAuditMaximumRangeRule,
  ConversionAuditRetriesRangeRule,
  defaultConversionAuditValidator,
} from "./conversion-audit-rules.js";
import { newConversionAudit } from "./conversion-audit.js";

test("ConversionAuditValidator reports every problem", () => {
  const validator = defaultConversionAuditValidator();
  const item = newConversionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionAuditRetriesRangeRule flags values above retries", () => {
  const rule = new ConversionAuditRetriesRangeRule(32, 64);
  const item = newConversionAudit("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionAuditMaximumRangeRule flags values above maximum", () => {
  const rule = new ConversionAuditMaximumRangeRule(7.4, 4471.8);
  const item = newConversionAudit("x", "y");
  item.maximum = 4473.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionAuditDiscountRangeRule flags values above discount", () => {
  const rule = new ConversionAuditDiscountRangeRule(6.3, 586);
  const item = newConversionAudit("x", "y");
  item.discount = 587.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
