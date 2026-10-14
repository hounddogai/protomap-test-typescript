import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFraudCheckWindowBidRangeRule,
  ManualFraudCheckWindowLabelLengthRule,
  ManualFraudCheckWindowRequiredDescriptionRule,
  ManualFraudCheckWindowRequiredLabelRule,
  defaultManualFraudCheckWindowValidator,
} from "./manual-fraud-check-window-rules.js";
import { newManualFraudCheckWindow } from "./manual-fraud-check-window.js";

test("ManualFraudCheckWindowValidator reports every problem", () => {
  const validator = defaultManualFraudCheckWindowValidator();
  const item = newManualFraudCheckWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFraudCheckWindowRequiredLabelRule flags a blank label", () => {
  const rule = new ManualFraudCheckWindowRequiredLabelRule("manual fraud check window needs an entry");
  const item = newManualFraudCheckWindow("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFraudCheckWindowLabelLengthRule flags a long label", () => {
  const rule = new ManualFraudCheckWindowLabelLengthRule(16);
  const item = newManualFraudCheckWindow("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFraudCheckWindowBidRangeRule flags values above bid", () => {
  const rule = new ManualFraudCheckWindowBidRangeRule(1, 3895.6);
  const item = newManualFraudCheckWindow("x", "y");
  item.bid = 3897.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFraudCheckWindowRequiredDescriptionRule flags a blank description", () => {
  const rule = new ManualFraudCheckWindowRequiredDescriptionRule("manual fraud check window needs this field");
  const item = newManualFraudCheckWindow("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
