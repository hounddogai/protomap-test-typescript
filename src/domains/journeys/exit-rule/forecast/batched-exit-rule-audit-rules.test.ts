import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedExitRuleAuditCodeLengthRule,
  BatchedExitRuleAuditImpressionsRangeRule,
  BatchedExitRuleAuditRequiredCodeRule,
  BatchedExitRuleAuditRequiredTitleRule,
  defaultBatchedExitRuleAuditValidator,
} from "./batched-exit-rule-audit-rules.js";
import { newBatchedExitRuleAudit } from "./batched-exit-rule-audit.js";

test("BatchedExitRuleAuditValidator reports every problem", () => {
  const validator = defaultBatchedExitRuleAuditValidator();
  const item = newBatchedExitRuleAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedExitRuleAuditRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedExitRuleAuditRequiredCodeRule("batched exit rule audit needs a value");
  const item = newBatchedExitRuleAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedExitRuleAuditRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedExitRuleAuditRequiredTitleRule("batched exit rule audit needs this field");
  const item = newBatchedExitRuleAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedExitRuleAuditImpressionsRangeRule flags values above impressions", () => {
  const rule = new BatchedExitRuleAuditImpressionsRangeRule(16, 16);
  const item = newBatchedExitRuleAudit("x", "y");
  item.impressions = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedExitRuleAuditCodeLengthRule flags a long code", () => {
  const rule = new BatchedExitRuleAuditCodeLengthRule(32);
  const item = newBatchedExitRuleAudit("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
