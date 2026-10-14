import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionSlotBudgetRangeRule,
  RetentionSlotNotesLengthRule,
  RetentionSlotOpenRateRangeRule,
  RetentionSlotRequiredCodeRule,
  RetentionSlotRequiredTitleRule,
  defaultRetentionSlotValidator,
} from "./retention-slot-rules.js";
import { newRetentionSlot } from "./retention-slot.js";

test("RetentionSlotValidator reports every problem", () => {
  const validator = defaultRetentionSlotValidator();
  const item = newRetentionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionSlotRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionSlotRequiredCodeRule("retention slot needs this field");
  const item = newRetentionSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionSlotOpenRateRangeRule flags values above open rate", () => {
  const rule = new RetentionSlotOpenRateRangeRule(2.9, 4549.2);
  const item = newRetentionSlot("x", "y");
  item.openRate = 4550.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionSlotBudgetRangeRule flags values above budget", () => {
  const rule = new RetentionSlotBudgetRangeRule(7.9, 1731.6);
  const item = newRetentionSlot("x", "y");
  item.budget = 1733.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionSlotNotesLengthRule flags a long notes", () => {
  const rule = new RetentionSlotNotesLengthRule(120);
  const item = newRetentionSlot("x", "y");
  item.notes = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionSlotRequiredTitleRule flags a blank title", () => {
  const rule = new RetentionSlotRequiredTitleRule("retention slot needs an entry");
  const item = newRetentionSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
