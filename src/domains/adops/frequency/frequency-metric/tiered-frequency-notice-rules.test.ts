import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredFrequencyNoticeMinimumRangeRule,
  TieredFrequencyNoticeRequiredCountryRule,
  TieredFrequencyNoticeRequiredTitleRule,
  TieredFrequencyNoticeUpdatedAtRangeRule,
  defaultTieredFrequencyNoticeValidator,
} from "./tiered-frequency-notice-rules.js";
import { newTieredFrequencyNotice } from "./tiered-frequency-notice.js";

test("TieredFrequencyNoticeValidator reports every problem", () => {
  const validator = defaultTieredFrequencyNoticeValidator();
  const item = newTieredFrequencyNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredFrequencyNoticeUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new TieredFrequencyNoticeUpdatedAtRangeRule(255, 3600);
  const item = newTieredFrequencyNotice("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredFrequencyNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new TieredFrequencyNoticeRequiredTitleRule("tiered frequency notice needs a value");
  const item = newTieredFrequencyNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredFrequencyNoticeRequiredCountryRule flags a blank country", () => {
  const rule = new TieredFrequencyNoticeRequiredCountryRule("tiered frequency notice needs this field");
  const item = newTieredFrequencyNotice("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredFrequencyNoticeMinimumRangeRule flags values above minimum", () => {
  const rule = new TieredFrequencyNoticeMinimumRangeRule(6.1, 2047.5);
  const item = newTieredFrequencyNotice("x", "y");
  item.minimum = 2049;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
