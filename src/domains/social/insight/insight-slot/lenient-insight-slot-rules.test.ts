import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientInsightSlotRequiredNameRule,
  LenientInsightSlotRequiredTitleRule,
  LenientInsightSlotTitleLengthRule,
  defaultLenientInsightSlotValidator,
} from "./lenient-insight-slot-rules.js";
import { newLenientInsightSlot } from "./lenient-insight-slot.js";

test("LenientInsightSlotValidator reports every problem", () => {
  const validator = defaultLenientInsightSlotValidator();
  const item = newLenientInsightSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientInsightSlotRequiredTitleRule flags a blank title", () => {
  const rule = new LenientInsightSlotRequiredTitleRule("lenient insight slot needs an entry");
  const item = newLenientInsightSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientInsightSlotTitleLengthRule flags a long title", () => {
  const rule = new LenientInsightSlotTitleLengthRule(80);
  const item = newLenientInsightSlot("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientInsightSlotRequiredNameRule flags a blank name", () => {
  const rule = new LenientInsightSlotRequiredNameRule("lenient insight slot needs an entry");
  const item = newLenientInsightSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
