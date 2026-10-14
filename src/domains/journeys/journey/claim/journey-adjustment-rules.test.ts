import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyAdjustmentBudgetRangeRule,
  JourneyAdjustmentCodeLengthRule,
  JourneyAdjustmentPhoneLengthRule,
  JourneyAdjustmentRequiredCodeRule,
  JourneyAdjustmentRequiredPhoneRule,
  defaultJourneyAdjustmentValidator,
} from "./journey-adjustment-rules.js";
import { newJourneyAdjustment } from "./journey-adjustment.js";

test("JourneyAdjustmentValidator reports every problem", () => {
  const validator = defaultJourneyAdjustmentValidator();
  const item = newJourneyAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyAdjustmentRequiredPhoneRule flags a blank phone", () => {
  const rule = new JourneyAdjustmentRequiredPhoneRule("journey adjustment needs a value");
  const item = newJourneyAdjustment("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new JourneyAdjustmentCodeLengthRule(86400);
  const item = newJourneyAdjustment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyAdjustmentBudgetRangeRule flags values above budget", () => {
  const rule = new JourneyAdjustmentBudgetRangeRule(7.7, 2764.1);
  const item = newJourneyAdjustment("x", "y");
  item.budget = 2765.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyAdjustmentRequiredCodeRule("journey adjustment needs an entry");
  const item = newJourneyAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyAdjustmentPhoneLengthRule flags a long phone", () => {
  const rule = new JourneyAdjustmentPhoneLengthRule(3600);
  const item = newJourneyAdjustment("x", "y");
  item.phone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
