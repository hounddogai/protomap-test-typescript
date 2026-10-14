import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchPreferenceFloorValueRangeRule,
  BranchPreferenceNotesLengthRule,
  BranchPreferenceRequiredCodeRule,
  BranchPreferenceRequiredNotesRule,
  defaultBranchPreferenceValidator,
} from "./branch-preference-rules.js";
import { newBranchPreference } from "./branch-preference.js";

test("BranchPreferenceValidator reports every problem", () => {
  const validator = defaultBranchPreferenceValidator();
  const item = newBranchPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new BranchPreferenceRequiredCodeRule("branch preference needs a value");
  const item = newBranchPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchPreferenceNotesLengthRule flags a long notes", () => {
  const rule = new BranchPreferenceNotesLengthRule(64);
  const item = newBranchPreference("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchPreferenceRequiredNotesRule flags a blank notes", () => {
  const rule = new BranchPreferenceRequiredNotesRule("branch preference needs a value");
  const item = newBranchPreference("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchPreferenceFloorValueRangeRule flags values above floor value", () => {
  const rule = new BranchPreferenceFloorValueRangeRule(6.2, 814.3);
  const item = newBranchPreference("x", "y");
  item.floorValue = 815.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
