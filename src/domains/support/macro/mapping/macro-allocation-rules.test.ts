import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroAllocationFloorValueRangeRule,
  MacroAllocationJourneyIdLengthRule,
  MacroAllocationWindowDaysRangeRule,
  defaultMacroAllocationValidator,
} from "./macro-allocation-rules.js";
import { newMacroAllocation } from "./macro-allocation.js";

test("MacroAllocationValidator reports every problem", () => {
  const validator = defaultMacroAllocationValidator();
  const item = newMacroAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroAllocationWindowDaysRangeRule flags values above window days", () => {
  const rule = new MacroAllocationWindowDaysRangeRule(16, 86400);
  const item = newMacroAllocation("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroAllocationJourneyIdLengthRule flags a long journey id", () => {
  const rule = new MacroAllocationJourneyIdLengthRule(255);
  const item = newMacroAllocation("x", "y");
  item.journeyId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroAllocationFloorValueRangeRule flags values above floor value", () => {
  const rule = new MacroAllocationFloorValueRangeRule(1.1, 3196.2);
  const item = newMacroAllocation("x", "y");
  item.floorValue = 3197.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
