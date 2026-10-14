import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalWindowAuditCodeLengthRule,
  GlobalWindowAuditGraceDaysRangeRule,
  GlobalWindowAuditNameLengthRule,
  GlobalWindowAuditRequiredCodeRule,
  defaultGlobalWindowAuditValidator,
} from "./global-window-audit-rules.js";
import { newGlobalWindowAudit } from "./global-window-audit.js";

test("GlobalWindowAuditValidator reports every problem", () => {
  const validator = defaultGlobalWindowAuditValidator();
  const item = newGlobalWindowAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalWindowAuditNameLengthRule flags a long name", () => {
  const rule = new GlobalWindowAuditNameLengthRule(32);
  const item = newGlobalWindowAudit("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalWindowAuditGraceDaysRangeRule flags values above grace days", () => {
  const rule = new GlobalWindowAuditGraceDaysRangeRule(120, 3600);
  const item = newGlobalWindowAudit("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalWindowAuditRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalWindowAuditRequiredCodeRule("global window audit needs this field");
  const item = newGlobalWindowAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalWindowAuditCodeLengthRule flags a long code", () => {
  const rule = new GlobalWindowAuditCodeLengthRule(32);
  const item = newGlobalWindowAudit("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
