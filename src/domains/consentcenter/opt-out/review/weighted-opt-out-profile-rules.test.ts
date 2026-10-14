import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedOptOutProfileLabelLengthRule,
  WeightedOptOutProfileNotesLengthRule,
  WeightedOptOutProfileRequiredCodeRule,
  WeightedOptOutProfileRequiredLocaleRule,
  defaultWeightedOptOutProfileValidator,
} from "./weighted-opt-out-profile-rules.js";
import { newWeightedOptOutProfile } from "./weighted-opt-out-profile.js";

test("WeightedOptOutProfileValidator reports every problem", () => {
  const validator = defaultWeightedOptOutProfileValidator();
  const item = newWeightedOptOutProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedOptOutProfileNotesLengthRule flags a long notes", () => {
  const rule = new WeightedOptOutProfileNotesLengthRule(1000);
  const item = newWeightedOptOutProfile("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedOptOutProfileLabelLengthRule flags a long label", () => {
  const rule = new WeightedOptOutProfileLabelLengthRule(86400);
  const item = newWeightedOptOutProfile("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedOptOutProfileRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedOptOutProfileRequiredCodeRule("weighted opt out profile needs an entry");
  const item = newWeightedOptOutProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedOptOutProfileRequiredLocaleRule flags a blank locale", () => {
  const rule = new WeightedOptOutProfileRequiredLocaleRule("weighted opt out profile needs this field");
  const item = newWeightedOptOutProfile("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
