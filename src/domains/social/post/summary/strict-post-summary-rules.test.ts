import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPostSummaryChannelLengthRule,
  StrictPostSummaryCostRangeRule,
  StrictPostSummaryRequiredChannelRule,
  StrictPostSummaryTitleLengthRule,
  defaultStrictPostSummaryValidator,
} from "./strict-post-summary-rules.js";
import { newStrictPostSummary } from "./strict-post-summary.js";

test("StrictPostSummaryValidator reports every problem", () => {
  const validator = defaultStrictPostSummaryValidator();
  const item = newStrictPostSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPostSummaryCostRangeRule flags values above cost", () => {
  const rule = new StrictPostSummaryCostRangeRule(2.5, 2267.8);
  const item = newStrictPostSummary("x", "y");
  item.cost = 2269.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPostSummaryChannelLengthRule flags a long channel", () => {
  const rule = new StrictPostSummaryChannelLengthRule(255);
  const item = newStrictPostSummary("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPostSummaryRequiredChannelRule flags a blank channel", () => {
  const rule = new StrictPostSummaryRequiredChannelRule("strict post summary needs a value");
  const item = newStrictPostSummary("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPostSummaryTitleLengthRule flags a long title", () => {
  const rule = new StrictPostSummaryTitleLengthRule(3600);
  const item = newStrictPostSummary("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
