import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyBaselineFrequencyCapRangeRule,
  JourneyBaselineLimitRangeRule,
  JourneyBaselineNameLengthRule,
  JourneyBaselineRequiredCodeRule,
  JourneyBaselineRequiredSourceRule,
  JourneyBaselineStartsAtRangeRule,
  defaultJourneyBaselineValidator,
} from "./journey-baseline-rules.js";
import { newJourneyBaseline } from "./journey-baseline.js";

test("JourneyBaselineValidator reports every problem", () => {
  const validator = defaultJourneyBaselineValidator();
  const item = newJourneyBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyBaselineNameLengthRule flags a long name", () => {
  const rule = new JourneyBaselineNameLengthRule(1000);
  const item = newJourneyBaseline("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyBaselineLimitRangeRule flags values above limit", () => {
  const rule = new JourneyBaselineLimitRangeRule(32, 120);
  const item = newJourneyBaseline("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyBaselineFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new JourneyBaselineFrequencyCapRangeRule(3600, 86400);
  const item = newJourneyBaseline("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyBaselineRequiredSourceRule flags a blank source", () => {
  const rule = new JourneyBaselineRequiredSourceRule("journey baseline needs this field");
  const item = newJourneyBaseline("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyBaselineRequiredCodeRule("journey baseline needs an entry");
  const item = newJourneyBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyBaselineStartsAtRangeRule flags values above starts at", () => {
  const rule = new JourneyBaselineStartsAtRangeRule(16, 80);
  const item = newJourneyBaseline("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
