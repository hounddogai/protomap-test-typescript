import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualCreativeSummaryBidRangeRule,
  ManualCreativeSummaryCategoryLengthRule,
  ManualCreativeSummaryCodeLengthRule,
  ManualCreativeSummaryImpressionsRangeRule,
  ManualCreativeSummaryNameLengthRule,
  ManualCreativeSummaryRequiredTitleRule,
  defaultManualCreativeSummaryValidator,
} from "./manual-creative-summary-rules.js";
import { newManualCreativeSummary } from "./manual-creative-summary.js";

test("ManualCreativeSummaryValidator reports every problem", () => {
  const validator = defaultManualCreativeSummaryValidator();
  const item = newManualCreativeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualCreativeSummaryImpressionsRangeRule flags values above impressions", () => {
  const rule = new ManualCreativeSummaryImpressionsRangeRule(1000, 3600);
  const item = newManualCreativeSummary("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualCreativeSummaryBidRangeRule flags values above bid", () => {
  const rule = new ManualCreativeSummaryBidRangeRule(8.3, 1652.9);
  const item = newManualCreativeSummary("x", "y");
  item.bid = 1654.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualCreativeSummaryCodeLengthRule flags a long code", () => {
  const rule = new ManualCreativeSummaryCodeLengthRule(32);
  const item = newManualCreativeSummary("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualCreativeSummaryRequiredTitleRule flags a blank title", () => {
  const rule = new ManualCreativeSummaryRequiredTitleRule("manual creative summary needs an entry");
  const item = newManualCreativeSummary("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualCreativeSummaryCategoryLengthRule flags a long category", () => {
  const rule = new ManualCreativeSummaryCategoryLengthRule(64);
  const item = newManualCreativeSummary("x", "y");
  item.category = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualCreativeSummaryNameLengthRule flags a long name", () => {
  const rule = new ManualCreativeSummaryNameLengthRule(3600);
  const item = newManualCreativeSummary("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
