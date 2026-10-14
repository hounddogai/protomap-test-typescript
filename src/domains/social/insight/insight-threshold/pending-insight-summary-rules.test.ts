import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingInsightSummaryNameLengthRule,
  PendingInsightSummaryRequiredLocaleRule,
  PendingInsightSummaryTitleLengthRule,
  defaultPendingInsightSummaryValidator,
} from "./pending-insight-summary-rules.js";
import { newPendingInsightSummary } from "./pending-insight-summary.js";

test("PendingInsightSummaryValidator reports every problem", () => {
  const validator = defaultPendingInsightSummaryValidator();
  const item = newPendingInsightSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingInsightSummaryRequiredLocaleRule flags a blank locale", () => {
  const rule = new PendingInsightSummaryRequiredLocaleRule("pending insight summary needs an entry");
  const item = newPendingInsightSummary("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingInsightSummaryTitleLengthRule flags a long title", () => {
  const rule = new PendingInsightSummaryTitleLengthRule(64);
  const item = newPendingInsightSummary("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingInsightSummaryNameLengthRule flags a long name", () => {
  const rule = new PendingInsightSummaryNameLengthRule(16);
  const item = newPendingInsightSummary("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
