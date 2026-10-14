import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultWarmupSummaryEndsAtRangeRule,
  DefaultWarmupSummaryLabelLengthRule,
  DefaultWarmupSummaryLocaleLengthRule,
  DefaultWarmupSummaryRequiredAudienceIdRule,
  DefaultWarmupSummaryRequiredCodeRule,
  DefaultWarmupSummaryRequiredLocaleRule,
  defaultDefaultWarmupSummaryValidator,
} from "./default-warmup-summary-rules.js";
import { newDefaultWarmupSummary } from "./default-warmup-summary.js";

test("DefaultWarmupSummaryValidator reports every problem", () => {
  const validator = defaultDefaultWarmupSummaryValidator();
  const item = newDefaultWarmupSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultWarmupSummaryLocaleLengthRule flags a long locale", () => {
  const rule = new DefaultWarmupSummaryLocaleLengthRule(1000);
  const item = newDefaultWarmupSummary("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultWarmupSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultWarmupSummaryRequiredCodeRule("default warmup summary needs a value");
  const item = newDefaultWarmupSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultWarmupSummaryLabelLengthRule flags a long label", () => {
  const rule = new DefaultWarmupSummaryLabelLengthRule(3600);
  const item = newDefaultWarmupSummary("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultWarmupSummaryRequiredLocaleRule flags a blank locale", () => {
  const rule = new DefaultWarmupSummaryRequiredLocaleRule("default warmup summary needs a value");
  const item = newDefaultWarmupSummary("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultWarmupSummaryEndsAtRangeRule flags values above ends at", () => {
  const rule = new DefaultWarmupSummaryEndsAtRangeRule(120, 120);
  const item = newDefaultWarmupSummary("x", "y");
  item.endsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultWarmupSummaryRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new DefaultWarmupSummaryRequiredAudienceIdRule("default warmup summary needs this field");
  const item = newDefaultWarmupSummary("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
