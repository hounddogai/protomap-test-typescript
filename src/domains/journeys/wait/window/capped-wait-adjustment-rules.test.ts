import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedWaitAdjustmentContactEmailLengthRule,
  CappedWaitAdjustmentDescriptionLengthRule,
  CappedWaitAdjustmentGraceDaysRangeRule,
  defaultCappedWaitAdjustmentValidator,
} from "./capped-wait-adjustment-rules.js";
import { newCappedWaitAdjustment } from "./capped-wait-adjustment.js";

test("CappedWaitAdjustmentValidator reports every problem", () => {
  const validator = defaultCappedWaitAdjustmentValidator();
  const item = newCappedWaitAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedWaitAdjustmentGraceDaysRangeRule flags values above grace days", () => {
  const rule = new CappedWaitAdjustmentGraceDaysRangeRule(80, 120);
  const item = newCappedWaitAdjustment("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedWaitAdjustmentDescriptionLengthRule flags a long description", () => {
  const rule = new CappedWaitAdjustmentDescriptionLengthRule(16);
  const item = newCappedWaitAdjustment("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedWaitAdjustmentContactEmailLengthRule flags a long contact email", () => {
  const rule = new CappedWaitAdjustmentContactEmailLengthRule(255);
  const item = newCappedWaitAdjustment("x", "y");
  item.contactEmail = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
