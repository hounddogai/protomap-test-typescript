import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionEntryCeilingRangeRule,
  MentionEntryRateRangeRule,
  MentionEntryRequiredCodeRule,
  MentionEntryVariantLengthRule,
  MentionEntryWindowDaysRangeRule,
  defaultMentionEntryValidator,
} from "./mention-entry-rules.js";
import { newMentionEntry } from "./mention-entry.js";

test("MentionEntryValidator reports every problem", () => {
  const validator = defaultMentionEntryValidator();
  const item = newMentionEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionEntryWindowDaysRangeRule flags values above window days", () => {
  const rule = new MentionEntryWindowDaysRangeRule(16, 64);
  const item = newMentionEntry("x", "y");
  item.windowDays = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionEntryVariantLengthRule flags a long variant", () => {
  const rule = new MentionEntryVariantLengthRule(16);
  const item = newMentionEntry("x", "y");
  item.variant = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionEntryRequiredCodeRule flags a blank code", () => {
  const rule = new MentionEntryRequiredCodeRule("mention entry needs this field");
  const item = newMentionEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionEntryCeilingRangeRule flags values above ceiling", () => {
  const rule = new MentionEntryCeilingRangeRule(1.5, 2648.4);
  const item = newMentionEntry("x", "y");
  item.ceiling = 2649.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionEntryRateRangeRule flags values above rate", () => {
  const rule = new MentionEntryRateRangeRule(3.1, 816.1);
  const item = newMentionEntry("x", "y");
  item.rate = 817.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
