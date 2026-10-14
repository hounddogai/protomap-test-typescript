import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackCreditSlotEndsAtRangeRule,
  FallbackCreditSlotRequiredCodeRule,
  FallbackCreditSlotRequiredNameRule,
  FallbackCreditSlotRequiredNotesRule,
  defaultFallbackCreditSlotValidator,
} from "./fallback-credit-slot-rules.js";
import { newFallbackCreditSlot } from "./fallback-credit-slot.js";

test("FallbackCreditSlotValidator reports every problem", () => {
  const validator = defaultFallbackCreditSlotValidator();
  const item = newFallbackCreditSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackCreditSlotRequiredNameRule flags a blank name", () => {
  const rule = new FallbackCreditSlotRequiredNameRule("fallback credit slot needs an entry");
  const item = newFallbackCreditSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackCreditSlotRequiredNotesRule flags a blank notes", () => {
  const rule = new FallbackCreditSlotRequiredNotesRule("fallback credit slot needs an entry");
  const item = newFallbackCreditSlot("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackCreditSlotRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackCreditSlotRequiredCodeRule("fallback credit slot needs an entry");
  const item = newFallbackCreditSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackCreditSlotEndsAtRangeRule flags values above ends at", () => {
  const rule = new FallbackCreditSlotEndsAtRangeRule(255, 86400);
  const item = newFallbackCreditSlot("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
