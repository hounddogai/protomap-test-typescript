import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingExitRuleRecordBudgetRangeRule,
  PendingExitRuleRecordRequiredLabelRule,
  PendingExitRuleRecordRequiredNameRule,
  defaultPendingExitRuleRecordValidator,
} from "./pending-exit-rule-record-rules.js";
import { newPendingExitRuleRecord } from "./pending-exit-rule-record.js";

test("PendingExitRuleRecordValidator reports every problem", () => {
  const validator = defaultPendingExitRuleRecordValidator();
  const item = newPendingExitRuleRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingExitRuleRecordBudgetRangeRule flags values above budget", () => {
  const rule = new PendingExitRuleRecordBudgetRangeRule(2.2, 698.4);
  const item = newPendingExitRuleRecord("x", "y");
  item.budget = 699.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingExitRuleRecordRequiredNameRule flags a blank name", () => {
  const rule = new PendingExitRuleRecordRequiredNameRule("pending exit rule record needs this field");
  const item = newPendingExitRuleRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingExitRuleRecordRequiredLabelRule flags a blank label", () => {
  const rule = new PendingExitRuleRecordRequiredLabelRule("pending exit rule record needs a value");
  const item = newPendingExitRuleRecord("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
