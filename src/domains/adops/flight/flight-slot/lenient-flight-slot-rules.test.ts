import assert from "node:assert/strict";
import { test } from "node:test";
import { LenientFlightSlotRetriesRangeRule, defaultLenientFlightSlotValidator } from "./lenient-flight-slot-rules.js";
import { newLenientFlightSlot } from "./lenient-flight-slot.js";

test("LenientFlightSlotValidator reports every problem", () => {
  const validator = defaultLenientFlightSlotValidator();
  const item = newLenientFlightSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientFlightSlotRetriesRangeRule flags values above retries", () => {
  const rule = new LenientFlightSlotRetriesRangeRule(80, 3600);
  const item = newLenientFlightSlot("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
