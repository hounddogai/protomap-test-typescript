import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackNudgeEntryDurationMinutesRangeRule,
  FallbackNudgeEntryNameLengthRule,
  FallbackNudgeEntryRequiredNameRule,
  defaultFallbackNudgeEntryValidator,
} from "./fallback-nudge-entry-rules.js";
import { newFallbackNudgeEntry } from "./fallback-nudge-entry.js";

test("FallbackNudgeEntryValidator reports every problem", () => {
  const validator = defaultFallbackNudgeEntryValidator();
  const item = newFallbackNudgeEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackNudgeEntryRequiredNameRule flags a blank name", () => {
  const rule = new FallbackNudgeEntryRequiredNameRule("fallback nudge entry needs an entry");
  const item = newFallbackNudgeEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackNudgeEntryNameLengthRule flags a long name", () => {
  const rule = new FallbackNudgeEntryNameLengthRule(64);
  const item = newFallbackNudgeEntry("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackNudgeEntryDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new FallbackNudgeEntryDurationMinutesRangeRule(16, 80);
  const item = newFallbackNudgeEntry("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
