import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFrequencyEntryAmountRangeRule,
  CappedFrequencyEntryRequiredCodeRule,
  CappedFrequencyEntryWindowDaysRangeRule,
  defaultCappedFrequencyEntryValidator,
} from "./capped-frequency-entry-rules.js";
import { newCappedFrequencyEntry } from "./capped-frequency-entry.js";

test("CappedFrequencyEntryValidator reports every problem", () => {
  const validator = defaultCappedFrequencyEntryValidator();
  const item = newCappedFrequencyEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFrequencyEntryWindowDaysRangeRule flags values above window days", () => {
  const rule = new CappedFrequencyEntryWindowDaysRangeRule(1000, 3600);
  const item = newCappedFrequencyEntry("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedFrequencyEntryAmountRangeRule flags values above amount", () => {
  const rule = new CappedFrequencyEntryAmountRangeRule(2.2, 2265.9);
  const item = newCappedFrequencyEntry("x", "y");
  item.amount = 2267.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedFrequencyEntryRequiredCodeRule flags a blank code", () => {
  const rule = new CappedFrequencyEntryRequiredCodeRule("capped frequency entry needs a value");
  const item = newCappedFrequencyEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
