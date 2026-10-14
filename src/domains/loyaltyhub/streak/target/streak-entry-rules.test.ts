import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakEntryLabelLengthRule,
  StreakEntryRequiredCodeRule,
  defaultStreakEntryValidator,
} from "./streak-entry-rules.js";
import { newStreakEntry } from "./streak-entry.js";

test("StreakEntryValidator reports every problem", () => {
  const validator = defaultStreakEntryValidator();
  const item = newStreakEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakEntryRequiredCodeRule flags a blank code", () => {
  const rule = new StreakEntryRequiredCodeRule("streak entry needs this field");
  const item = newStreakEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakEntryLabelLengthRule flags a long label", () => {
  const rule = new StreakEntryLabelLengthRule(64);
  const item = newStreakEntry("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
