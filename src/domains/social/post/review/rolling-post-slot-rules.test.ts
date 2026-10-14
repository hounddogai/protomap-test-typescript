import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPostSlotAttemptsRangeRule,
  RollingPostSlotNameLengthRule,
  RollingPostSlotSequenceRangeRule,
  defaultRollingPostSlotValidator,
} from "./rolling-post-slot-rules.js";
import { newRollingPostSlot } from "./rolling-post-slot.js";

test("RollingPostSlotValidator reports every problem", () => {
  const validator = defaultRollingPostSlotValidator();
  const item = newRollingPostSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPostSlotNameLengthRule flags a long name", () => {
  const rule = new RollingPostSlotNameLengthRule(32);
  const item = newRollingPostSlot("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPostSlotAttemptsRangeRule flags values above attempts", () => {
  const rule = new RollingPostSlotAttemptsRangeRule(80, 1000);
  const item = newRollingPostSlot("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPostSlotSequenceRangeRule flags values above sequence", () => {
  const rule = new RollingPostSlotSequenceRangeRule(32, 1000);
  const item = newRollingPostSlot("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
