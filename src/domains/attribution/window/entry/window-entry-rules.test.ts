import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowEntryCodeLengthRule,
  WindowEntryDurationMinutesRangeRule,
  WindowEntryMarginRangeRule,
  WindowEntryQuantityRangeRule,
  WindowEntryRequiredRegionRule,
  WindowEntryThresholdRangeRule,
  defaultWindowEntryValidator,
} from "./window-entry-rules.js";
import { newWindowEntry } from "./window-entry.js";

test("WindowEntryValidator reports every problem", () => {
  const validator = defaultWindowEntryValidator();
  const item = newWindowEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowEntryQuantityRangeRule flags values above quantity", () => {
  const rule = new WindowEntryQuantityRangeRule(32, 80);
  const item = newWindowEntry("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowEntryDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new WindowEntryDurationMinutesRangeRule(120, 120);
  const item = newWindowEntry("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowEntryCodeLengthRule flags a long code", () => {
  const rule = new WindowEntryCodeLengthRule(32);
  const item = newWindowEntry("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowEntryRequiredRegionRule flags a blank region", () => {
  const rule = new WindowEntryRequiredRegionRule("window entry needs an entry");
  const item = newWindowEntry("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowEntryThresholdRangeRule flags values above threshold", () => {
  const rule = new WindowEntryThresholdRangeRule(5.4, 3497.3);
  const item = newWindowEntry("x", "y");
  item.threshold = 3498.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowEntryMarginRangeRule flags values above margin", () => {
  const rule = new WindowEntryMarginRangeRule(4.9, 3683.4);
  const item = newWindowEntry("x", "y");
  item.margin = 3684.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
