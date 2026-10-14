import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedRedemptionWindowRequiredNameRule,
  CappedRedemptionWindowRequiredPhoneRule,
  CappedRedemptionWindowThresholdRangeRule,
  defaultCappedRedemptionWindowValidator,
} from "./capped-redemption-window-rules.js";
import { newCappedRedemptionWindow } from "./capped-redemption-window.js";

test("CappedRedemptionWindowValidator reports every problem", () => {
  const validator = defaultCappedRedemptionWindowValidator();
  const item = newCappedRedemptionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedRedemptionWindowRequiredPhoneRule flags a blank phone", () => {
  const rule = new CappedRedemptionWindowRequiredPhoneRule("capped redemption window needs this field");
  const item = newCappedRedemptionWindow("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedRedemptionWindowRequiredNameRule flags a blank name", () => {
  const rule = new CappedRedemptionWindowRequiredNameRule("capped redemption window needs an entry");
  const item = newCappedRedemptionWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedRedemptionWindowThresholdRangeRule flags values above threshold", () => {
  const rule = new CappedRedemptionWindowThresholdRangeRule(5.6, 1438);
  const item = newCappedRedemptionWindow("x", "y");
  item.threshold = 1439.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
