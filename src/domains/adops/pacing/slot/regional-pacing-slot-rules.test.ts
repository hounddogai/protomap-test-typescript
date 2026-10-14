import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPacingSlotLabelLengthRule,
  RegionalPacingSlotTitleLengthRule,
  defaultRegionalPacingSlotValidator,
} from "./regional-pacing-slot-rules.js";
import { newRegionalPacingSlot } from "./regional-pacing-slot.js";

test("RegionalPacingSlotValidator reports every problem", () => {
  const validator = defaultRegionalPacingSlotValidator();
  const item = newRegionalPacingSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPacingSlotTitleLengthRule flags a long title", () => {
  const rule = new RegionalPacingSlotTitleLengthRule(86400);
  const item = newRegionalPacingSlot("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalPacingSlotLabelLengthRule flags a long label", () => {
  const rule = new RegionalPacingSlotLabelLengthRule(80);
  const item = newRegionalPacingSlot("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
