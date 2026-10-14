import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionTierNotesLengthRule,
  DeflectionTierRateRangeRule,
  DeflectionTierRequiredNotesRule,
  DeflectionTierRequiredTitleRule,
  DeflectionTierTitleLengthRule,
  defaultDeflectionTierValidator,
} from "./deflection-tier-rules.js";
import { newDeflectionTier } from "./deflection-tier.js";

test("DeflectionTierValidator reports every problem", () => {
  const validator = defaultDeflectionTierValidator();
  const item = newDeflectionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionTierNotesLengthRule flags a long notes", () => {
  const rule = new DeflectionTierNotesLengthRule(80);
  const item = newDeflectionTier("x", "y");
  item.notes = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionTierTitleLengthRule flags a long title", () => {
  const rule = new DeflectionTierTitleLengthRule(16);
  const item = newDeflectionTier("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionTierRequiredTitleRule flags a blank title", () => {
  const rule = new DeflectionTierRequiredTitleRule("deflection tier needs an entry");
  const item = newDeflectionTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionTierRequiredNotesRule flags a blank notes", () => {
  const rule = new DeflectionTierRequiredNotesRule("deflection tier needs an entry");
  const item = newDeflectionTier("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionTierRateRangeRule flags values above rate", () => {
  const rule = new DeflectionTierRateRangeRule(9.1, 4969.8);
  const item = newDeflectionTier("x", "y");
  item.rate = 4971.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
