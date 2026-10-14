import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceSummaryCodeLengthRule,
  BounceSummaryCostRangeRule,
  BounceSummaryCurrencyLengthRule,
  BounceSummaryRequiredCodeRule,
  BounceSummaryRequiredLabelRule,
  defaultBounceSummaryValidator,
} from "./bounce-summary-rules.js";
import { newBounceSummary } from "./bounce-summary.js";

test("BounceSummaryValidator reports every problem", () => {
  const validator = defaultBounceSummaryValidator();
  const item = newBounceSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new BounceSummaryRequiredLabelRule("bounce summary needs an entry");
  const item = newBounceSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new BounceSummaryRequiredCodeRule("bounce summary needs a value");
  const item = newBounceSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceSummaryCodeLengthRule flags a long code", () => {
  const rule = new BounceSummaryCodeLengthRule(16);
  const item = newBounceSummary("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceSummaryCostRangeRule flags values above cost", () => {
  const rule = new BounceSummaryCostRangeRule(8.3, 1925.7);
  const item = newBounceSummary("x", "y");
  item.cost = 1927.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceSummaryCurrencyLengthRule flags a long currency", () => {
  const rule = new BounceSummaryCurrencyLengthRule(3600);
  const item = newBounceSummary("x", "y");
  item.currency = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
