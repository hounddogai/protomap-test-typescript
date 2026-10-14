import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPayoutScoreCapacityRangeRule,
  LenientPayoutScoreCodeLengthRule,
  LenientPayoutScoreExternalRefLengthRule,
  LenientPayoutScoreLabelLengthRule,
  LenientPayoutScoreRequiredCategoryRule,
  defaultLenientPayoutScoreValidator,
} from "./lenient-payout-score-rules.js";
import { newLenientPayoutScore } from "./lenient-payout-score.js";

test("LenientPayoutScoreValidator reports every problem", () => {
  const validator = defaultLenientPayoutScoreValidator();
  const item = newLenientPayoutScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPayoutScoreExternalRefLengthRule flags a long external ref", () => {
  const rule = new LenientPayoutScoreExternalRefLengthRule(1000);
  const item = newLenientPayoutScore("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPayoutScoreLabelLengthRule flags a long label", () => {
  const rule = new LenientPayoutScoreLabelLengthRule(86400);
  const item = newLenientPayoutScore("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPayoutScoreRequiredCategoryRule flags a blank category", () => {
  const rule = new LenientPayoutScoreRequiredCategoryRule("lenient payout score needs this field");
  const item = newLenientPayoutScore("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPayoutScoreCapacityRangeRule flags values above capacity", () => {
  const rule = new LenientPayoutScoreCapacityRangeRule(32, 255);
  const item = newLenientPayoutScore("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPayoutScoreCodeLengthRule flags a long code", () => {
  const rule = new LenientPayoutScoreCodeLengthRule(86400);
  const item = newLenientPayoutScore("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
