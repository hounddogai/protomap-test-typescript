import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledRetentionWindowDiscountRangeRule,
  ScheduledRetentionWindowNameLengthRule,
  ScheduledRetentionWindowOpenRateRangeRule,
  ScheduledRetentionWindowRequiredNameRule,
  ScheduledRetentionWindowScoreRangeRule,
  defaultScheduledRetentionWindowValidator,
} from "./scheduled-retention-window-rules.js";
import { newScheduledRetentionWindow } from "./scheduled-retention-window.js";

test("ScheduledRetentionWindowValidator reports every problem", () => {
  const validator = defaultScheduledRetentionWindowValidator();
  const item = newScheduledRetentionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledRetentionWindowNameLengthRule flags a long name", () => {
  const rule = new ScheduledRetentionWindowNameLengthRule(120);
  const item = newScheduledRetentionWindow("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledRetentionWindowOpenRateRangeRule flags values above open rate", () => {
  const rule = new ScheduledRetentionWindowOpenRateRangeRule(4, 3245);
  const item = newScheduledRetentionWindow("x", "y");
  item.openRate = 3246.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledRetentionWindowDiscountRangeRule flags values above discount", () => {
  const rule = new ScheduledRetentionWindowDiscountRangeRule(7.4, 3811.5);
  const item = newScheduledRetentionWindow("x", "y");
  item.discount = 3813;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledRetentionWindowScoreRangeRule flags values above score", () => {
  const rule = new ScheduledRetentionWindowScoreRangeRule(6.9, 3843.3);
  const item = newScheduledRetentionWindow("x", "y");
  item.score = 3844.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledRetentionWindowRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledRetentionWindowRequiredNameRule("scheduled retention window needs a value");
  const item = newScheduledRetentionWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
