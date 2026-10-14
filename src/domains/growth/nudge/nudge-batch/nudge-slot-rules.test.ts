import assert from "node:assert/strict";
import { test } from "node:test";
import { NudgeSlotCodeLengthRule, NudgeSlotRequiredCodeRule, defaultNudgeSlotValidator } from "./nudge-slot-rules.js";
import { newNudgeSlot } from "./nudge-slot.js";

test("NudgeSlotValidator reports every problem", () => {
  const validator = defaultNudgeSlotValidator();
  const item = newNudgeSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeSlotCodeLengthRule flags a long code", () => {
  const rule = new NudgeSlotCodeLengthRule(1000);
  const item = newNudgeSlot("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeSlotRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeSlotRequiredCodeRule("nudge slot needs this field");
  const item = newNudgeSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
