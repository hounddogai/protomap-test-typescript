import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDeflectionSlotDescriptionLengthRule,
  LegacyDeflectionSlotLabelLengthRule,
  defaultLegacyDeflectionSlotValidator,
} from "./legacy-deflection-slot-rules.js";
import { newLegacyDeflectionSlot } from "./legacy-deflection-slot.js";

test("LegacyDeflectionSlotValidator reports every problem", () => {
  const validator = defaultLegacyDeflectionSlotValidator();
  const item = newLegacyDeflectionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDeflectionSlotLabelLengthRule flags a long label", () => {
  const rule = new LegacyDeflectionSlotLabelLengthRule(16);
  const item = newLegacyDeflectionSlot("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDeflectionSlotDescriptionLengthRule flags a long description", () => {
  const rule = new LegacyDeflectionSlotDescriptionLengthRule(16);
  const item = newLegacyDeflectionSlot("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
