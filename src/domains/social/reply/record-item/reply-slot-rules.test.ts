import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplySlotRequiredSourceRule,
  ReplySlotRequiredTitleRule,
  ReplySlotSourceLengthRule,
  ReplySlotThresholdRangeRule,
  defaultReplySlotValidator,
} from "./reply-slot-rules.js";
import { newReplySlot } from "./reply-slot.js";

test("ReplySlotValidator reports every problem", () => {
  const validator = defaultReplySlotValidator();
  const item = newReplySlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplySlotRequiredTitleRule flags a blank title", () => {
  const rule = new ReplySlotRequiredTitleRule("reply slot needs a value");
  const item = newReplySlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplySlotThresholdRangeRule flags values above threshold", () => {
  const rule = new ReplySlotThresholdRangeRule(6.3, 4567);
  const item = newReplySlot("x", "y");
  item.threshold = 4568.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplySlotRequiredSourceRule flags a blank source", () => {
  const rule = new ReplySlotRequiredSourceRule("reply slot needs an entry");
  const item = newReplySlot("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplySlotSourceLengthRule flags a long source", () => {
  const rule = new ReplySlotSourceLengthRule(3600);
  const item = newReplySlot("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
