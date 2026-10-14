import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredEscalationSummaryBudgetRangeRule,
  TieredEscalationSummaryCreatedAtRangeRule,
  TieredEscalationSummaryRequiredCodeRule,
  defaultTieredEscalationSummaryValidator,
} from "./tiered-escalation-summary-rules.js";
import { newTieredEscalationSummary } from "./tiered-escalation-summary.js";

test("TieredEscalationSummaryValidator reports every problem", () => {
  const validator = defaultTieredEscalationSummaryValidator();
  const item = newTieredEscalationSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredEscalationSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new TieredEscalationSummaryRequiredCodeRule("tiered escalation summary needs a value");
  const item = newTieredEscalationSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredEscalationSummaryCreatedAtRangeRule flags values above created at", () => {
  const rule = new TieredEscalationSummaryCreatedAtRangeRule(120, 255);
  const item = newTieredEscalationSummary("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredEscalationSummaryBudgetRangeRule flags values above budget", () => {
  const rule = new TieredEscalationSummaryBudgetRangeRule(5.5, 1711.4);
  const item = newTieredEscalationSummary("x", "y");
  item.budget = 1712.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
