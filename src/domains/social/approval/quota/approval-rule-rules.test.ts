import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalRuleDurationMinutesRangeRule,
  ApprovalRuleRequiredCodeRule,
  ApprovalRuleRequiredTitleRule,
  ApprovalRuleRevisionRangeRule,
  defaultApprovalRuleValidator,
} from "./approval-rule-rules.js";
import { newApprovalRule } from "./approval-rule.js";

test("ApprovalRuleValidator reports every problem", () => {
  const validator = defaultApprovalRuleValidator();
  const item = newApprovalRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalRuleRequiredTitleRule flags a blank title", () => {
  const rule = new ApprovalRuleRequiredTitleRule("approval rule needs a value");
  const item = newApprovalRule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalRuleRequiredCodeRule flags a blank code", () => {
  const rule = new ApprovalRuleRequiredCodeRule("approval rule needs an entry");
  const item = newApprovalRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalRuleRevisionRangeRule flags values above revision", () => {
  const rule = new ApprovalRuleRevisionRangeRule(16, 32);
  const item = newApprovalRule("x", "y");
  item.revision = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalRuleDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ApprovalRuleDurationMinutesRangeRule(64, 86400);
  const item = newApprovalRule("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
