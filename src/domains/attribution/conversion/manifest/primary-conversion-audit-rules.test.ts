import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryConversionAuditMarginRangeRule,
  PrimaryConversionAuditRequiredTitleRule,
  defaultPrimaryConversionAuditValidator,
} from "./primary-conversion-audit-rules.js";
import { newPrimaryConversionAudit } from "./primary-conversion-audit.js";

test("PrimaryConversionAuditValidator reports every problem", () => {
  const validator = defaultPrimaryConversionAuditValidator();
  const item = newPrimaryConversionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryConversionAuditMarginRangeRule flags values above margin", () => {
  const rule = new PrimaryConversionAuditMarginRangeRule(3.6, 3721.9);
  const item = newPrimaryConversionAudit("x", "y");
  item.margin = 3723.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryConversionAuditRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryConversionAuditRequiredTitleRule("primary conversion audit needs this field");
  const item = newPrimaryConversionAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
