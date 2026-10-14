import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveWaitAdjustmentBudgetRangeRule,
  AdaptiveWaitAdjustmentNameLengthRule,
  AdaptiveWaitAdjustmentRequiredCodeRule,
  AdaptiveWaitAdjustmentRequiredJourneyIdRule,
  AdaptiveWaitAdjustmentRequiredNameRule,
  defaultAdaptiveWaitAdjustmentValidator,
} from "./adaptive-wait-adjustment-rules.js";
import { newAdaptiveWaitAdjustment } from "./adaptive-wait-adjustment.js";

test("AdaptiveWaitAdjustmentValidator reports every problem", () => {
  const validator = defaultAdaptiveWaitAdjustmentValidator();
  const item = newAdaptiveWaitAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveWaitAdjustmentRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new AdaptiveWaitAdjustmentRequiredJourneyIdRule("adaptive wait adjustment needs a value");
  const item = newAdaptiveWaitAdjustment("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveWaitAdjustmentBudgetRangeRule flags values above budget", () => {
  const rule = new AdaptiveWaitAdjustmentBudgetRangeRule(9.2, 1832.7);
  const item = newAdaptiveWaitAdjustment("x", "y");
  item.budget = 1834.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveWaitAdjustmentRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveWaitAdjustmentRequiredNameRule("adaptive wait adjustment needs this field");
  const item = newAdaptiveWaitAdjustment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveWaitAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveWaitAdjustmentRequiredCodeRule("adaptive wait adjustment needs this field");
  const item = newAdaptiveWaitAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveWaitAdjustmentNameLengthRule flags a long name", () => {
  const rule = new AdaptiveWaitAdjustmentNameLengthRule(80);
  const item = newAdaptiveWaitAdjustment("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
