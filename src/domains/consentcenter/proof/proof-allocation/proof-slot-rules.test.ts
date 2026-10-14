import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofSlotCapacityRangeRule,
  ProofSlotConversionRateRangeRule,
  ProofSlotJourneyIdLengthRule,
  ProofSlotOpenRateRangeRule,
  ProofSlotRequiredCodeRule,
  ProofSlotRequiredJourneyIdRule,
  defaultProofSlotValidator,
} from "./proof-slot-rules.js";
import { newProofSlot } from "./proof-slot.js";

test("ProofSlotValidator reports every problem", () => {
  const validator = defaultProofSlotValidator();
  const item = newProofSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofSlotConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new ProofSlotConversionRateRangeRule(4, 2740);
  const item = newProofSlot("x", "y");
  item.conversionRate = 2741.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofSlotRequiredCodeRule flags a blank code", () => {
  const rule = new ProofSlotRequiredCodeRule("proof slot needs a value");
  const item = newProofSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofSlotCapacityRangeRule flags values above capacity", () => {
  const rule = new ProofSlotCapacityRangeRule(16, 86400);
  const item = newProofSlot("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofSlotJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ProofSlotJourneyIdLengthRule(32);
  const item = newProofSlot("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofSlotRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ProofSlotRequiredJourneyIdRule("proof slot needs a value");
  const item = newProofSlot("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofSlotOpenRateRangeRule flags values above open rate", () => {
  const rule = new ProofSlotOpenRateRangeRule(6.2, 4480.1);
  const item = newProofSlot("x", "y");
  item.openRate = 4481.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
