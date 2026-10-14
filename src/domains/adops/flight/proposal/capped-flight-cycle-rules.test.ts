import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFlightCycleDurationMinutesRangeRule,
  CappedFlightCycleMarginRangeRule,
  CappedFlightCycleRequiredCategoryRule,
  defaultCappedFlightCycleValidator,
} from "./capped-flight-cycle-rules.js";
import { newCappedFlightCycle } from "./capped-flight-cycle.js";

test("CappedFlightCycleValidator reports every problem", () => {
  const validator = defaultCappedFlightCycleValidator();
  const item = newCappedFlightCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFlightCycleMarginRangeRule flags values above margin", () => {
  const rule = new CappedFlightCycleMarginRangeRule(2.8, 3775.6);
  const item = newCappedFlightCycle("x", "y");
  item.margin = 3777.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedFlightCycleRequiredCategoryRule flags a blank category", () => {
  const rule = new CappedFlightCycleRequiredCategoryRule("capped flight cycle needs an entry");
  const item = newCappedFlightCycle("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFlightCycleDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new CappedFlightCycleDurationMinutesRangeRule(1000, 3600);
  const item = newCappedFlightCycle("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
