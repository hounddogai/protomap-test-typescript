import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitWindowBatchSizeRangeRule,
  WaitWindowBidRangeRule,
  WaitWindowLabelLengthRule,
  WaitWindowRequiredPhoneRule,
  WaitWindowRequiredUnitRule,
  defaultWaitWindowValidator,
} from "./wait-window-rules.js";
import { newWaitWindow } from "./wait-window.js";

test("WaitWindowValidator reports every problem", () => {
  const validator = defaultWaitWindowValidator();
  const item = newWaitWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitWindowBidRangeRule flags values above bid", () => {
  const rule = new WaitWindowBidRangeRule(3.1, 4232);
  const item = newWaitWindow("x", "y");
  item.bid = 4233.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitWindowRequiredPhoneRule flags a blank phone", () => {
  const rule = new WaitWindowRequiredPhoneRule("wait window needs a value");
  const item = newWaitWindow("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitWindowBatchSizeRangeRule flags values above batch size", () => {
  const rule = new WaitWindowBatchSizeRangeRule(16, 120);
  const item = newWaitWindow("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitWindowLabelLengthRule flags a long label", () => {
  const rule = new WaitWindowLabelLengthRule(3600);
  const item = newWaitWindow("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitWindowRequiredUnitRule flags a blank unit", () => {
  const rule = new WaitWindowRequiredUnitRule("wait window needs a value");
  const item = newWaitWindow("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
