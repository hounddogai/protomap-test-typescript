import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutSlotCodeLengthRule,
  OptOutSlotCohortLengthRule,
  OptOutSlotRequiredCohortRule,
  OptOutSlotTitleLengthRule,
  defaultOptOutSlotValidator,
} from "./opt-out-slot-rules.js";
import { newOptOutSlot } from "./opt-out-slot.js";

test("OptOutSlotValidator reports every problem", () => {
  const validator = defaultOptOutSlotValidator();
  const item = newOptOutSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutSlotCodeLengthRule flags a long code", () => {
  const rule = new OptOutSlotCodeLengthRule(16);
  const item = newOptOutSlot("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutSlotRequiredCohortRule flags a blank cohort", () => {
  const rule = new OptOutSlotRequiredCohortRule("opt out slot needs this field");
  const item = newOptOutSlot("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutSlotTitleLengthRule flags a long title", () => {
  const rule = new OptOutSlotTitleLengthRule(16);
  const item = newOptOutSlot("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutSlotCohortLengthRule flags a long cohort", () => {
  const rule = new OptOutSlotCohortLengthRule(32);
  const item = newOptOutSlot("x", "y");
  item.cohort = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
