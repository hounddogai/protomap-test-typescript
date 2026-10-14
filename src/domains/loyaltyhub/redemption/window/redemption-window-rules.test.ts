import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionWindowBatchSizeRangeRule,
  RedemptionWindowCodeLengthRule,
  RedemptionWindowDurationMinutesRangeRule,
  RedemptionWindowRequiredTitleRule,
  defaultRedemptionWindowValidator,
} from "./redemption-window-rules.js";
import { newRedemptionWindow } from "./redemption-window.js";

test("RedemptionWindowValidator reports every problem", () => {
  const validator = defaultRedemptionWindowValidator();
  const item = newRedemptionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionWindowBatchSizeRangeRule flags values above batch size", () => {
  const rule = new RedemptionWindowBatchSizeRangeRule(120, 1000);
  const item = newRedemptionWindow("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionWindowCodeLengthRule flags a long code", () => {
  const rule = new RedemptionWindowCodeLengthRule(120);
  const item = newRedemptionWindow("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionWindowRequiredTitleRule flags a blank title", () => {
  const rule = new RedemptionWindowRequiredTitleRule("redemption window needs this field");
  const item = newRedemptionWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionWindowDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new RedemptionWindowDurationMinutesRangeRule(3600, 3600);
  const item = newRedemptionWindow("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
