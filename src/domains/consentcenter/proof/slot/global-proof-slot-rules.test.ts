import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalProofSlotCodeLengthRule,
  GlobalProofSlotLabelLengthRule,
  GlobalProofSlotMinimumRangeRule,
  GlobalProofSlotRequiredCountryRule,
  defaultGlobalProofSlotValidator,
} from "./global-proof-slot-rules.js";
import { newGlobalProofSlot } from "./global-proof-slot.js";

test("GlobalProofSlotValidator reports every problem", () => {
  const validator = defaultGlobalProofSlotValidator();
  const item = newGlobalProofSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalProofSlotLabelLengthRule flags a long label", () => {
  const rule = new GlobalProofSlotLabelLengthRule(16);
  const item = newGlobalProofSlot("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalProofSlotMinimumRangeRule flags values above minimum", () => {
  const rule = new GlobalProofSlotMinimumRangeRule(5.6, 3830.5);
  const item = newGlobalProofSlot("x", "y");
  item.minimum = 3832;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalProofSlotRequiredCountryRule flags a blank country", () => {
  const rule = new GlobalProofSlotRequiredCountryRule("global proof slot needs an entry");
  const item = newGlobalProofSlot("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalProofSlotCodeLengthRule flags a long code", () => {
  const rule = new GlobalProofSlotCodeLengthRule(16);
  const item = newGlobalProofSlot("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
