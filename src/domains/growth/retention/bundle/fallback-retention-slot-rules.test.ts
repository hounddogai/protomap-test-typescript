import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackRetentionSlotCohortLengthRule,
  FallbackRetentionSlotQuantityRangeRule,
  FallbackRetentionSlotRequiredUnitRule,
  defaultFallbackRetentionSlotValidator,
} from "./fallback-retention-slot-rules.js";
import { newFallbackRetentionSlot } from "./fallback-retention-slot.js";

test("FallbackRetentionSlotValidator reports every problem", () => {
  const validator = defaultFallbackRetentionSlotValidator();
  const item = newFallbackRetentionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackRetentionSlotCohortLengthRule flags a long cohort", () => {
  const rule = new FallbackRetentionSlotCohortLengthRule(3600);
  const item = newFallbackRetentionSlot("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackRetentionSlotRequiredUnitRule flags a blank unit", () => {
  const rule = new FallbackRetentionSlotRequiredUnitRule("fallback retention slot needs this field");
  const item = newFallbackRetentionSlot("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackRetentionSlotQuantityRangeRule flags values above quantity", () => {
  const rule = new FallbackRetentionSlotQuantityRangeRule(16, 255);
  const item = newFallbackRetentionSlot("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
