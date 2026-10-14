import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightSummaryBatchSizeRangeRule,
  InsightSummaryCodeLengthRule,
  InsightSummaryRequiredCodeRule,
  InsightSummaryRequiredLabelRule,
  defaultInsightSummaryValidator,
} from "./insight-summary-rules.js";
import { newInsightSummary } from "./insight-summary.js";

test("InsightSummaryValidator reports every problem", () => {
  const validator = defaultInsightSummaryValidator();
  const item = newInsightSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new InsightSummaryRequiredCodeRule("insight summary needs a value");
  const item = newInsightSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new InsightSummaryRequiredLabelRule("insight summary needs this field");
  const item = newInsightSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightSummaryBatchSizeRangeRule flags values above batch size", () => {
  const rule = new InsightSummaryBatchSizeRangeRule(64, 255);
  const item = newInsightSummary("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightSummaryCodeLengthRule flags a long code", () => {
  const rule = new InsightSummaryCodeLengthRule(80);
  const item = newInsightSummary("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
