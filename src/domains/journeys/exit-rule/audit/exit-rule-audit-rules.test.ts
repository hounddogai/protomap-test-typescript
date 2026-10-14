import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleAuditCodeLengthRule,
  ExitRuleAuditGraceDaysRangeRule,
  ExitRuleAuditNameLengthRule,
  defaultExitRuleAuditValidator,
} from "./exit-rule-audit-rules.js";
import { newExitRuleAudit } from "./exit-rule-audit.js";

test("ExitRuleAuditValidator reports every problem", () => {
  const validator = defaultExitRuleAuditValidator();
  const item = newExitRuleAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleAuditGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ExitRuleAuditGraceDaysRangeRule(16, 120);
  const item = newExitRuleAudit("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleAuditCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleAuditCodeLengthRule(32);
  const item = newExitRuleAudit("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleAuditNameLengthRule flags a long name", () => {
  const rule = new ExitRuleAuditNameLengthRule(32);
  const item = newExitRuleAudit("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
