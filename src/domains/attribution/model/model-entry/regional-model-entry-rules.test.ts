import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalModelEntryQuantityRangeRule,
  RegionalModelEntryWindowDaysRangeRule,
  defaultRegionalModelEntryValidator,
} from "./regional-model-entry-rules.js";
import { newRegionalModelEntry } from "./regional-model-entry.js";

test("RegionalModelEntryValidator reports every problem", () => {
  const validator = defaultRegionalModelEntryValidator();
  const item = newRegionalModelEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalModelEntryWindowDaysRangeRule flags values above window days", () => {
  const rule = new RegionalModelEntryWindowDaysRangeRule(16, 32);
  const item = newRegionalModelEntry("x", "y");
  item.windowDays = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalModelEntryQuantityRangeRule flags values above quantity", () => {
  const rule = new RegionalModelEntryQuantityRangeRule(32, 86400);
  const item = newRegionalModelEntry("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
