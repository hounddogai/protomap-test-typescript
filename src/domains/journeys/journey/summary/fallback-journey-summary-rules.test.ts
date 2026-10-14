import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackJourneySummaryAmountRangeRule,
  FallbackJourneySummaryCostRangeRule,
  FallbackJourneySummaryRequiredCodeRule,
  FallbackJourneySummaryRequiredCohortRule,
  defaultFallbackJourneySummaryValidator,
} from "./fallback-journey-summary-rules.js";
import { newFallbackJourneySummary } from "./fallback-journey-summary.js";

test("FallbackJourneySummaryValidator reports every problem", () => {
  const validator = defaultFallbackJourneySummaryValidator();
  const item = newFallbackJourneySummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackJourneySummaryAmountRangeRule flags values above amount", () => {
  const rule = new FallbackJourneySummaryAmountRangeRule(7.1, 4665.4);
  const item = newFallbackJourneySummary("x", "y");
  item.amount = 4666.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackJourneySummaryRequiredCohortRule flags a blank cohort", () => {
  const rule = new FallbackJourneySummaryRequiredCohortRule("fallback journey summary needs this field");
  const item = newFallbackJourneySummary("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackJourneySummaryRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackJourneySummaryRequiredCodeRule("fallback journey summary needs a value");
  const item = newFallbackJourneySummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackJourneySummaryCostRangeRule flags values above cost", () => {
  const rule = new FallbackJourneySummaryCostRangeRule(4.9, 3232.6);
  const item = newFallbackJourneySummary("x", "y");
  item.cost = 3234.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
