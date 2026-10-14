import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyFlightCycleExpiresAtRangeRule,
  LegacyFlightCycleRequiredUtmSourceRule,
  LegacyFlightCycleSummaryLengthRule,
  LegacyFlightCycleTitleLengthRule,
  defaultLegacyFlightCycleValidator,
} from "./legacy-flight-cycle-rules.js";
import { newLegacyFlightCycle } from "./legacy-flight-cycle.js";

test("LegacyFlightCycleValidator reports every problem", () => {
  const validator = defaultLegacyFlightCycleValidator();
  const item = newLegacyFlightCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyFlightCycleExpiresAtRangeRule flags values above expires at", () => {
  const rule = new LegacyFlightCycleExpiresAtRangeRule(16, 255);
  const item = newLegacyFlightCycle("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyFlightCycleRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new LegacyFlightCycleRequiredUtmSourceRule("legacy flight cycle needs this field");
  const item = newLegacyFlightCycle("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFlightCycleTitleLengthRule flags a long title", () => {
  const rule = new LegacyFlightCycleTitleLengthRule(255);
  const item = newLegacyFlightCycle("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFlightCycleSummaryLengthRule flags a long summary", () => {
  const rule = new LegacyFlightCycleSummaryLengthRule(32);
  const item = newLegacyFlightCycle("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
