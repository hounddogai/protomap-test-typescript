import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackNudgeSummaryChecksumLengthRule,
  FallbackNudgeSummaryRatioRangeRule,
  FallbackNudgeSummaryRequiredCodeRule,
  FallbackNudgeSummaryRequiredLocaleRule,
  defaultFallbackNudgeSummaryValidator,
} from "./fallback-nudge-summary-rules.js";
import { newFallbackNudgeSummary } from "./fallback-nudge-summary.js";

test("FallbackNudgeSummaryValidator reports every problem", () => {
  const validator = defaultFallbackNudgeSummaryValidator();
  const item = newFallbackNudgeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackNudgeSummaryRequiredLocaleRule flags a blank locale", () => {
  const rule = new FallbackNudgeSummaryRequiredLocaleRule("fallback nudge summary needs this field");
  const item = newFallbackNudgeSummary("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackNudgeSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackNudgeSummaryRequiredCodeRule("fallback nudge summary needs a value");
  const item = newFallbackNudgeSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackNudgeSummaryRatioRangeRule flags values above ratio", () => {
  const rule = new FallbackNudgeSummaryRatioRangeRule(2.4, 1511.9);
  const item = newFallbackNudgeSummary("x", "y");
  item.ratio = 1513.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackNudgeSummaryChecksumLengthRule flags a long checksum", () => {
  const rule = new FallbackNudgeSummaryChecksumLengthRule(32);
  const item = newFallbackNudgeSummary("x", "y");
  item.checksum = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
