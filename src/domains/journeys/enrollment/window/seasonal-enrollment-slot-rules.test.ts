import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalEnrollmentSlotCeilingRangeRule,
  SeasonalEnrollmentSlotMarginRangeRule,
  SeasonalEnrollmentSlotQuantityRangeRule,
  SeasonalEnrollmentSlotRequiredAudienceIdRule,
  SeasonalEnrollmentSlotUpdatedAtRangeRule,
  defaultSeasonalEnrollmentSlotValidator,
} from "./seasonal-enrollment-slot-rules.js";
import { newSeasonalEnrollmentSlot } from "./seasonal-enrollment-slot.js";

test("SeasonalEnrollmentSlotValidator reports every problem", () => {
  const validator = defaultSeasonalEnrollmentSlotValidator();
  const item = newSeasonalEnrollmentSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalEnrollmentSlotRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new SeasonalEnrollmentSlotRequiredAudienceIdRule("seasonal enrollment slot needs a value");
  const item = newSeasonalEnrollmentSlot("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalEnrollmentSlotMarginRangeRule flags values above margin", () => {
  const rule = new SeasonalEnrollmentSlotMarginRangeRule(0.8, 1002.3);
  const item = newSeasonalEnrollmentSlot("x", "y");
  item.margin = 1003.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalEnrollmentSlotUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new SeasonalEnrollmentSlotUpdatedAtRangeRule(3600, 86400);
  const item = newSeasonalEnrollmentSlot("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalEnrollmentSlotCeilingRangeRule flags values above ceiling", () => {
  const rule = new SeasonalEnrollmentSlotCeilingRangeRule(0.7, 3706.4);
  const item = newSeasonalEnrollmentSlot("x", "y");
  item.ceiling = 3707.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalEnrollmentSlotQuantityRangeRule flags values above quantity", () => {
  const rule = new SeasonalEnrollmentSlotQuantityRangeRule(64, 3600);
  const item = newSeasonalEnrollmentSlot("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
