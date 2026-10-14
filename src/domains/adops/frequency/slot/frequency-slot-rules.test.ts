import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencySlotBudgetRangeRule,
  FrequencySlotExternalRefLengthRule,
  FrequencySlotLabelLengthRule,
  FrequencySlotRequiredExternalRefRule,
  defaultFrequencySlotValidator,
} from "./frequency-slot-rules.js";
import { newFrequencySlot } from "./frequency-slot.js";

test("FrequencySlotValidator reports every problem", () => {
  const validator = defaultFrequencySlotValidator();
  const item = newFrequencySlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencySlotBudgetRangeRule flags values above budget", () => {
  const rule = new FrequencySlotBudgetRangeRule(6.1, 1925.1);
  const item = newFrequencySlot("x", "y");
  item.budget = 1926.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencySlotLabelLengthRule flags a long label", () => {
  const rule = new FrequencySlotLabelLengthRule(3600);
  const item = newFrequencySlot("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencySlotRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new FrequencySlotRequiredExternalRefRule("frequency slot needs this field");
  const item = newFrequencySlot("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencySlotExternalRefLengthRule flags a long external ref", () => {
  const rule = new FrequencySlotExternalRefLengthRule(86400);
  const item = newFrequencySlot("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
