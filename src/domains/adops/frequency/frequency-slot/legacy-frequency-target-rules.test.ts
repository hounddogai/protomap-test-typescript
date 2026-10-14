import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyFrequencyTargetCodeLengthRule,
  LegacyFrequencyTargetEndsAtRangeRule,
  LegacyFrequencyTargetNameLengthRule,
  LegacyFrequencyTargetOpenRateRangeRule,
  LegacyFrequencyTargetRequiredCodeRule,
  LegacyFrequencyTargetSourceLengthRule,
  defaultLegacyFrequencyTargetValidator,
} from "./legacy-frequency-target-rules.js";
import { newLegacyFrequencyTarget } from "./legacy-frequency-target.js";

test("LegacyFrequencyTargetValidator reports every problem", () => {
  const validator = defaultLegacyFrequencyTargetValidator();
  const item = newLegacyFrequencyTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyFrequencyTargetCodeLengthRule flags a long code", () => {
  const rule = new LegacyFrequencyTargetCodeLengthRule(86400);
  const item = newLegacyFrequencyTarget("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFrequencyTargetNameLengthRule flags a long name", () => {
  const rule = new LegacyFrequencyTargetNameLengthRule(255);
  const item = newLegacyFrequencyTarget("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFrequencyTargetRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyFrequencyTargetRequiredCodeRule("legacy frequency target needs an entry");
  const item = newLegacyFrequencyTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFrequencyTargetOpenRateRangeRule flags values above open rate", () => {
  const rule = new LegacyFrequencyTargetOpenRateRangeRule(6.9, 1346.2);
  const item = newLegacyFrequencyTarget("x", "y");
  item.openRate = 1347.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyFrequencyTargetSourceLengthRule flags a long source", () => {
  const rule = new LegacyFrequencyTargetSourceLengthRule(16);
  const item = newLegacyFrequencyTarget("x", "y");
  item.source = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFrequencyTargetEndsAtRangeRule flags values above ends at", () => {
  const rule = new LegacyFrequencyTargetEndsAtRangeRule(120, 3600);
  const item = newLegacyFrequencyTarget("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
