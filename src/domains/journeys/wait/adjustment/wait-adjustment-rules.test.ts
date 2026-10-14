import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitAdjustmentCeilingRangeRule,
  WaitAdjustmentImpressionsRangeRule,
  WaitAdjustmentRequiredCodeRule,
  WaitAdjustmentRequiredUtmSourceRule,
  WaitAdjustmentRetriesRangeRule,
  WaitAdjustmentUtmSourceLengthRule,
  defaultWaitAdjustmentValidator,
} from "./wait-adjustment-rules.js";
import { newWaitAdjustment } from "./wait-adjustment.js";

test("WaitAdjustmentValidator reports every problem", () => {
  const validator = defaultWaitAdjustmentValidator();
  const item = newWaitAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitAdjustmentRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new WaitAdjustmentRequiredUtmSourceRule("wait adjustment needs this field");
  const item = newWaitAdjustment("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitAdjustmentUtmSourceLengthRule flags a long utm source", () => {
  const rule = new WaitAdjustmentUtmSourceLengthRule(16);
  const item = newWaitAdjustment("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitAdjustmentRetriesRangeRule flags values above retries", () => {
  const rule = new WaitAdjustmentRetriesRangeRule(64, 80);
  const item = newWaitAdjustment("x", "y");
  item.retries = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitAdjustmentImpressionsRangeRule flags values above impressions", () => {
  const rule = new WaitAdjustmentImpressionsRangeRule(64, 120);
  const item = newWaitAdjustment("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new WaitAdjustmentRequiredCodeRule("wait adjustment needs a value");
  const item = newWaitAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitAdjustmentCeilingRangeRule flags values above ceiling", () => {
  const rule = new WaitAdjustmentCeilingRangeRule(8.3, 4883.7);
  const item = newWaitAdjustment("x", "y");
  item.ceiling = 4885.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
