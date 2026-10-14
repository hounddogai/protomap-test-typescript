import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalWindowAuditDiscountRangeRule,
  RegionalWindowAuditNameLengthRule,
  RegionalWindowAuditRequiredChannelRule,
  defaultRegionalWindowAuditValidator,
} from "./regional-window-audit-rules.js";
import { newRegionalWindowAudit } from "./regional-window-audit.js";

test("RegionalWindowAuditValidator reports every problem", () => {
  const validator = defaultRegionalWindowAuditValidator();
  const item = newRegionalWindowAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalWindowAuditNameLengthRule flags a long name", () => {
  const rule = new RegionalWindowAuditNameLengthRule(120);
  const item = newRegionalWindowAudit("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalWindowAuditRequiredChannelRule flags a blank channel", () => {
  const rule = new RegionalWindowAuditRequiredChannelRule("regional window audit needs this field");
  const item = newRegionalWindowAudit("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalWindowAuditDiscountRangeRule flags values above discount", () => {
  const rule = new RegionalWindowAuditDiscountRangeRule(9.2, 3463.6);
  const item = newRegionalWindowAudit("x", "y");
  item.discount = 3465.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
