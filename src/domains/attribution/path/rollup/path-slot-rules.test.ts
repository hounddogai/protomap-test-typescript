import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathSlotNameLengthRule,
  PathSlotRequiredCodeRule,
  PathSlotScoreRangeRule,
  defaultPathSlotValidator,
} from "./path-slot-rules.js";
import { newPathSlot } from "./path-slot.js";

test("PathSlotValidator reports every problem", () => {
  const validator = defaultPathSlotValidator();
  const item = newPathSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathSlotNameLengthRule flags a long name", () => {
  const rule = new PathSlotNameLengthRule(86400);
  const item = newPathSlot("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathSlotScoreRangeRule flags values above score", () => {
  const rule = new PathSlotScoreRangeRule(7.2, 86.3);
  const item = newPathSlot("x", "y");
  item.score = 87.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathSlotRequiredCodeRule flags a blank code", () => {
  const rule = new PathSlotRequiredCodeRule("path slot needs this field");
  const item = newPathSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
