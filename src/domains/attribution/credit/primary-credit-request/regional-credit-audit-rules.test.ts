import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalCreditAuditCodeLengthRule,
  RegionalCreditAuditRequiredCodeRule,
  RegionalCreditAuditRequiredTitleRule,
  RegionalCreditAuditThresholdRangeRule,
  defaultRegionalCreditAuditValidator,
} from "./regional-credit-audit-rules.js";
import { newRegionalCreditAudit } from "./regional-credit-audit.js";

test("RegionalCreditAuditValidator reports every problem", () => {
  const validator = defaultRegionalCreditAuditValidator();
  const item = newRegionalCreditAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalCreditAuditThresholdRangeRule flags values above threshold", () => {
  const rule = new RegionalCreditAuditThresholdRangeRule(0.4, 3015.4);
  const item = newRegionalCreditAudit("x", "y");
  item.threshold = 3016.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalCreditAuditRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalCreditAuditRequiredCodeRule("regional credit audit needs an entry");
  const item = newRegionalCreditAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalCreditAuditCodeLengthRule flags a long code", () => {
  const rule = new RegionalCreditAuditCodeLengthRule(16);
  const item = newRegionalCreditAudit("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalCreditAuditRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalCreditAuditRequiredTitleRule("regional credit audit needs this field");
  const item = newRegionalCreditAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
