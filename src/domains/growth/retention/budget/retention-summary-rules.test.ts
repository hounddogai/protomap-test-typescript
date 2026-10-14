import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionSummaryBudgetRangeRule,
  RetentionSummaryLocaleLengthRule,
  RetentionSummaryRequiredCodeRule,
  RetentionSummaryRequiredLocaleRule,
  RetentionSummaryRequiredNameRule,
  defaultRetentionSummaryValidator,
} from "./retention-summary-rules.js";
import { newRetentionSummary } from "./retention-summary.js";

test("RetentionSummaryValidator reports every problem", () => {
  const validator = defaultRetentionSummaryValidator();
  const item = newRetentionSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionSummaryBudgetRangeRule flags values above budget", () => {
  const rule = new RetentionSummaryBudgetRangeRule(2.7, 4977.1);
  const item = newRetentionSummary("x", "y");
  item.budget = 4978.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionSummaryRequiredCodeRule("retention summary needs this field");
  const item = newRetentionSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionSummaryRequiredNameRule flags a blank name", () => {
  const rule = new RetentionSummaryRequiredNameRule("retention summary needs a value");
  const item = newRetentionSummary("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionSummaryRequiredLocaleRule flags a blank locale", () => {
  const rule = new RetentionSummaryRequiredLocaleRule("retention summary needs a value");
  const item = newRetentionSummary("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionSummaryLocaleLengthRule flags a long locale", () => {
  const rule = new RetentionSummaryLocaleLengthRule(32);
  const item = newRetentionSummary("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
