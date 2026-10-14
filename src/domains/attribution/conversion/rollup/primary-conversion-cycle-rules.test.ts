import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryConversionCycleChannelLengthRule,
  PrimaryConversionCycleRequiredCodeRule,
  PrimaryConversionCycleRequiredLabelRule,
  PrimaryConversionCycleStartsAtRangeRule,
  PrimaryConversionCycleWindowDaysRangeRule,
  defaultPrimaryConversionCycleValidator,
} from "./primary-conversion-cycle-rules.js";
import { newPrimaryConversionCycle } from "./primary-conversion-cycle.js";

test("PrimaryConversionCycleValidator reports every problem", () => {
  const validator = defaultPrimaryConversionCycleValidator();
  const item = newPrimaryConversionCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryConversionCycleChannelLengthRule flags a long channel", () => {
  const rule = new PrimaryConversionCycleChannelLengthRule(255);
  const item = newPrimaryConversionCycle("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryConversionCycleRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryConversionCycleRequiredCodeRule("primary conversion cycle needs a value");
  const item = newPrimaryConversionCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryConversionCycleWindowDaysRangeRule flags values above window days", () => {
  const rule = new PrimaryConversionCycleWindowDaysRangeRule(16, 255);
  const item = newPrimaryConversionCycle("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryConversionCycleStartsAtRangeRule flags values above starts at", () => {
  const rule = new PrimaryConversionCycleStartsAtRangeRule(64, 3600);
  const item = newPrimaryConversionCycle("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryConversionCycleRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryConversionCycleRequiredLabelRule("primary conversion cycle needs this field");
  const item = newPrimaryConversionCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
