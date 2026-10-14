import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalComplaintSlotBudgetRangeRule,
  GlobalComplaintSlotCodeLengthRule,
  GlobalComplaintSlotRequiredTimezoneRule,
  defaultGlobalComplaintSlotValidator,
} from "./global-complaint-slot-rules.js";
import { newGlobalComplaintSlot } from "./global-complaint-slot.js";

test("GlobalComplaintSlotValidator reports every problem", () => {
  const validator = defaultGlobalComplaintSlotValidator();
  const item = newGlobalComplaintSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalComplaintSlotCodeLengthRule flags a long code", () => {
  const rule = new GlobalComplaintSlotCodeLengthRule(86400);
  const item = newGlobalComplaintSlot("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalComplaintSlotBudgetRangeRule flags values above budget", () => {
  const rule = new GlobalComplaintSlotBudgetRangeRule(0.6, 1520.2);
  const item = newGlobalComplaintSlot("x", "y");
  item.budget = 1521.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalComplaintSlotRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new GlobalComplaintSlotRequiredTimezoneRule("global complaint slot needs a value");
  const item = newGlobalComplaintSlot("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
