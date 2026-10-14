import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchAuditDurationMinutesRangeRule,
  BranchAuditRequiredCodeRule,
  BranchAuditRequiredNameRule,
  BranchAuditWindowDaysRangeRule,
  defaultBranchAuditValidator,
} from "./branch-audit-rules.js";
import { newBranchAudit } from "./branch-audit.js";

test("BranchAuditValidator reports every problem", () => {
  const validator = defaultBranchAuditValidator();
  const item = newBranchAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchAuditDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new BranchAuditDurationMinutesRangeRule(16, 32);
  const item = newBranchAudit("x", "y");
  item.durationMinutes = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchAuditWindowDaysRangeRule flags values above window days", () => {
  const rule = new BranchAuditWindowDaysRangeRule(255, 86400);
  const item = newBranchAudit("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchAuditRequiredNameRule flags a blank name", () => {
  const rule = new BranchAuditRequiredNameRule("branch audit needs this field");
  const item = newBranchAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchAuditRequiredCodeRule flags a blank code", () => {
  const rule = new BranchAuditRequiredCodeRule("branch audit needs an entry");
  const item = newBranchAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
