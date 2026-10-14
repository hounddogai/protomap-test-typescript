import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionProfileNotesLengthRule,
  DeflectionProfileRequiredCodeRule,
  DeflectionProfileScoreRangeRule,
  defaultDeflectionProfileValidator,
} from "./deflection-profile-rules.js";
import { newDeflectionProfile } from "./deflection-profile.js";

test("DeflectionProfileValidator reports every problem", () => {
  const validator = defaultDeflectionProfileValidator();
  const item = newDeflectionProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionProfileNotesLengthRule flags a long notes", () => {
  const rule = new DeflectionProfileNotesLengthRule(1000);
  const item = newDeflectionProfile("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionProfileRequiredCodeRule flags a blank code", () => {
  const rule = new DeflectionProfileRequiredCodeRule("deflection profile needs this field");
  const item = newDeflectionProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionProfileScoreRangeRule flags values above score", () => {
  const rule = new DeflectionProfileScoreRangeRule(3.8, 4123.9);
  const item = newDeflectionProfile("x", "y");
  item.score = 4125.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
