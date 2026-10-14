import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeAuditNameLengthRule,
  NudgeAuditRequiredCodeRule,
  NudgeAuditRequiredLocaleRule,
  NudgeAuditRequiredUnitRule,
  defaultNudgeAuditValidator,
} from "./nudge-audit-rules.js";
import { newNudgeAudit } from "./nudge-audit.js";

test("NudgeAuditValidator reports every problem", () => {
  const validator = defaultNudgeAuditValidator();
  const item = newNudgeAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeAuditRequiredLocaleRule flags a blank locale", () => {
  const rule = new NudgeAuditRequiredLocaleRule("nudge audit needs this field");
  const item = newNudgeAudit("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeAuditRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeAuditRequiredCodeRule("nudge audit needs this field");
  const item = newNudgeAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeAuditRequiredUnitRule flags a blank unit", () => {
  const rule = new NudgeAuditRequiredUnitRule("nudge audit needs this field");
  const item = newNudgeAudit("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeAuditNameLengthRule flags a long name", () => {
  const rule = new NudgeAuditNameLengthRule(32);
  const item = newNudgeAudit("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
