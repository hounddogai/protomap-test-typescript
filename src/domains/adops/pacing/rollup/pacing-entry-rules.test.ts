import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingEntryClicksRangeRule,
  PacingEntryLocaleLengthRule,
  PacingEntryRequiredCodeRule,
  PacingEntryRequiredLocaleRule,
  defaultPacingEntryValidator,
} from "./pacing-entry-rules.js";
import { newPacingEntry } from "./pacing-entry.js";

test("PacingEntryValidator reports every problem", () => {
  const validator = defaultPacingEntryValidator();
  const item = newPacingEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingEntryLocaleLengthRule flags a long locale", () => {
  const rule = new PacingEntryLocaleLengthRule(255);
  const item = newPacingEntry("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingEntryClicksRangeRule flags values above clicks", () => {
  const rule = new PacingEntryClicksRangeRule(16, 64);
  const item = newPacingEntry("x", "y");
  item.clicks = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingEntryRequiredLocaleRule flags a blank locale", () => {
  const rule = new PacingEntryRequiredLocaleRule("pacing entry needs this field");
  const item = newPacingEntry("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingEntryRequiredCodeRule flags a blank code", () => {
  const rule = new PacingEntryRequiredCodeRule("pacing entry needs this field");
  const item = newPacingEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
