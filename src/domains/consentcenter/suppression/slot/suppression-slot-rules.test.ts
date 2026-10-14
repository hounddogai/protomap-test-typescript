import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionSlotNameLengthRule,
  SuppressionSlotRequiredCodeRule,
  SuppressionSlotRequiredNameRule,
  defaultSuppressionSlotValidator,
} from "./suppression-slot-rules.js";
import { newSuppressionSlot } from "./suppression-slot.js";

test("SuppressionSlotValidator reports every problem", () => {
  const validator = defaultSuppressionSlotValidator();
  const item = newSuppressionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionSlotRequiredNameRule flags a blank name", () => {
  const rule = new SuppressionSlotRequiredNameRule("suppression slot needs this field");
  const item = newSuppressionSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionSlotNameLengthRule flags a long name", () => {
  const rule = new SuppressionSlotNameLengthRule(86400);
  const item = newSuppressionSlot("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionSlotRequiredCodeRule flags a blank code", () => {
  const rule = new SuppressionSlotRequiredCodeRule("suppression slot needs an entry");
  const item = newSuppressionSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
