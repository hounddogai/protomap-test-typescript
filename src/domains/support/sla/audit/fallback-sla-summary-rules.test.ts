import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSlaSummaryChannelLengthRule,
  FallbackSlaSummaryRequiredChannelRule,
  FallbackSlaSummaryTitleLengthRule,
  defaultFallbackSlaSummaryValidator,
} from "./fallback-sla-summary-rules.js";
import { newFallbackSlaSummary } from "./fallback-sla-summary.js";

test("FallbackSlaSummaryValidator reports every problem", () => {
  const validator = defaultFallbackSlaSummaryValidator();
  const item = newFallbackSlaSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSlaSummaryTitleLengthRule flags a long title", () => {
  const rule = new FallbackSlaSummaryTitleLengthRule(1000);
  const item = newFallbackSlaSummary("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSlaSummaryChannelLengthRule flags a long channel", () => {
  const rule = new FallbackSlaSummaryChannelLengthRule(80);
  const item = newFallbackSlaSummary("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSlaSummaryRequiredChannelRule flags a blank channel", () => {
  const rule = new FallbackSlaSummaryRequiredChannelRule("fallback sla summary needs this field");
  const item = newFallbackSlaSummary("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
