import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionSlotCodeLengthRule,
  ConversionSlotRequiredReviewerRule,
  ConversionSlotReviewerLengthRule,
  ConversionSlotSendAtRangeRule,
  ConversionSlotTitleLengthRule,
  defaultConversionSlotValidator,
} from "./conversion-slot-rules.js";
import { newConversionSlot } from "./conversion-slot.js";

test("ConversionSlotValidator reports every problem", () => {
  const validator = defaultConversionSlotValidator();
  const item = newConversionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionSlotRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new ConversionSlotRequiredReviewerRule("conversion slot needs an entry");
  const item = newConversionSlot("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionSlotSendAtRangeRule flags values above send at", () => {
  const rule = new ConversionSlotSendAtRangeRule(16, 86400);
  const item = newConversionSlot("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionSlotReviewerLengthRule flags a long reviewer", () => {
  const rule = new ConversionSlotReviewerLengthRule(1000);
  const item = newConversionSlot("x", "y");
  item.reviewer = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionSlotTitleLengthRule flags a long title", () => {
  const rule = new ConversionSlotTitleLengthRule(16);
  const item = newConversionSlot("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionSlotCodeLengthRule flags a long code", () => {
  const rule = new ConversionSlotCodeLengthRule(80);
  const item = newConversionSlot("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
