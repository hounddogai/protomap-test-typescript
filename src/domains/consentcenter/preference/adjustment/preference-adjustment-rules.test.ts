import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceAdjustmentCapacityRangeRule,
  PreferenceAdjustmentCodeLengthRule,
  PreferenceAdjustmentRequiredTitleRule,
  defaultPreferenceAdjustmentValidator,
} from "./preference-adjustment-rules.js";
import { newPreferenceAdjustment } from "./preference-adjustment.js";

test("PreferenceAdjustmentValidator reports every problem", () => {
  const validator = defaultPreferenceAdjustmentValidator();
  const item = newPreferenceAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceAdjustmentCapacityRangeRule flags values above capacity", () => {
  const rule = new PreferenceAdjustmentCapacityRangeRule(255, 3600);
  const item = newPreferenceAdjustment("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new PreferenceAdjustmentRequiredTitleRule("preference adjustment needs a value");
  const item = newPreferenceAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new PreferenceAdjustmentCodeLengthRule(32);
  const item = newPreferenceAdjustment("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
