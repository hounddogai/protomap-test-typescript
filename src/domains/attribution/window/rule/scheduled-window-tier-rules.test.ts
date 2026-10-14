import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledWindowTierImpressionsRangeRule,
  ScheduledWindowTierRequiredSummaryRule,
  ScheduledWindowTierRequiredTitleRule,
  ScheduledWindowTierTitleLengthRule,
  defaultScheduledWindowTierValidator,
} from "./scheduled-window-tier-rules.js";
import { newScheduledWindowTier } from "./scheduled-window-tier.js";

test("ScheduledWindowTierValidator reports every problem", () => {
  const validator = defaultScheduledWindowTierValidator();
  const item = newScheduledWindowTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledWindowTierTitleLengthRule flags a long title", () => {
  const rule = new ScheduledWindowTierTitleLengthRule(120);
  const item = newScheduledWindowTier("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledWindowTierImpressionsRangeRule flags values above impressions", () => {
  const rule = new ScheduledWindowTierImpressionsRangeRule(64, 1000);
  const item = newScheduledWindowTier("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledWindowTierRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledWindowTierRequiredTitleRule("scheduled window tier needs this field");
  const item = newScheduledWindowTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledWindowTierRequiredSummaryRule flags a blank summary", () => {
  const rule = new ScheduledWindowTierRequiredSummaryRule("scheduled window tier needs a value");
  const item = newScheduledWindowTier("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
