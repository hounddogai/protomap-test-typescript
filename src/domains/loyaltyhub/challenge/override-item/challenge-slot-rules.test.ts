import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeSlotBidRangeRule,
  ChallengeSlotRequiredSummaryRule,
  ChallengeSlotRequiredUnitRule,
  ChallengeSlotSummaryLengthRule,
  defaultChallengeSlotValidator,
} from "./challenge-slot-rules.js";
import { newChallengeSlot } from "./challenge-slot.js";

test("ChallengeSlotValidator reports every problem", () => {
  const validator = defaultChallengeSlotValidator();
  const item = newChallengeSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeSlotBidRangeRule flags values above bid", () => {
  const rule = new ChallengeSlotBidRangeRule(0.8, 2067);
  const item = newChallengeSlot("x", "y");
  item.bid = 2068.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeSlotRequiredSummaryRule flags a blank summary", () => {
  const rule = new ChallengeSlotRequiredSummaryRule("challenge slot needs this field");
  const item = newChallengeSlot("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeSlotSummaryLengthRule flags a long summary", () => {
  const rule = new ChallengeSlotSummaryLengthRule(80);
  const item = newChallengeSlot("x", "y");
  item.summary = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeSlotRequiredUnitRule flags a blank unit", () => {
  const rule = new ChallengeSlotRequiredUnitRule("challenge slot needs a value");
  const item = newChallengeSlot("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
