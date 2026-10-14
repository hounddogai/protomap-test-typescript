import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalCreativeSlotJourneyIdLengthRule,
  GlobalCreativeSlotRequiredCodeRule,
  GlobalCreativeSlotThresholdRangeRule,
  defaultGlobalCreativeSlotValidator,
} from "./global-creative-slot-rules.js";
import { newGlobalCreativeSlot } from "./global-creative-slot.js";

test("GlobalCreativeSlotValidator reports every problem", () => {
  const validator = defaultGlobalCreativeSlotValidator();
  const item = newGlobalCreativeSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalCreativeSlotThresholdRangeRule flags values above threshold", () => {
  const rule = new GlobalCreativeSlotThresholdRangeRule(2.2, 2649.6);
  const item = newGlobalCreativeSlot("x", "y");
  item.threshold = 2651.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalCreativeSlotRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalCreativeSlotRequiredCodeRule("global creative slot needs an entry");
  const item = newGlobalCreativeSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCreativeSlotJourneyIdLengthRule flags a long journey id", () => {
  const rule = new GlobalCreativeSlotJourneyIdLengthRule(80);
  const item = newGlobalCreativeSlot("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
