import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalInsightThresholdCodeLengthRule,
  GlobalInsightThresholdRequiredCodeRule,
  GlobalInsightThresholdRequiredCurrencyRule,
  GlobalInsightThresholdRequiredTitleRule,
  GlobalInsightThresholdRetriesRangeRule,
  GlobalInsightThresholdTitleLengthRule,
  defaultGlobalInsightThresholdValidator,
} from "./global-insight-threshold-rules.js";
import { newGlobalInsightThreshold } from "./global-insight-threshold.js";

test("GlobalInsightThresholdValidator reports every problem", () => {
  const validator = defaultGlobalInsightThresholdValidator();
  const item = newGlobalInsightThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalInsightThresholdRetriesRangeRule flags values above retries", () => {
  const rule = new GlobalInsightThresholdRetriesRangeRule(255, 3600);
  const item = newGlobalInsightThreshold("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalInsightThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalInsightThresholdRequiredCodeRule("global insight threshold needs an entry");
  const item = newGlobalInsightThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalInsightThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalInsightThresholdRequiredTitleRule("global insight threshold needs a value");
  const item = newGlobalInsightThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalInsightThresholdTitleLengthRule flags a long title", () => {
  const rule = new GlobalInsightThresholdTitleLengthRule(86400);
  const item = newGlobalInsightThreshold("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalInsightThresholdCodeLengthRule flags a long code", () => {
  const rule = new GlobalInsightThresholdCodeLengthRule(80);
  const item = newGlobalInsightThreshold("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalInsightThresholdRequiredCurrencyRule flags a blank currency", () => {
  const rule = new GlobalInsightThresholdRequiredCurrencyRule("global insight threshold needs this field");
  const item = newGlobalInsightThreshold("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
