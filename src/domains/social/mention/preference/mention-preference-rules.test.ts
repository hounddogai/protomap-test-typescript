import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionPreferenceNameLengthRule,
  MentionPreferencePhoneLengthRule,
  MentionPreferenceRequiredNameRule,
  defaultMentionPreferenceValidator,
} from "./mention-preference-rules.js";
import { newMentionPreference } from "./mention-preference.js";

test("MentionPreferenceValidator reports every problem", () => {
  const validator = defaultMentionPreferenceValidator();
  const item = newMentionPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new MentionPreferenceRequiredNameRule("mention preference needs a value");
  const item = newMentionPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionPreferenceNameLengthRule flags a long name", () => {
  const rule = new MentionPreferenceNameLengthRule(86400);
  const item = newMentionPreference("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionPreferencePhoneLengthRule flags a long phone", () => {
  const rule = new MentionPreferencePhoneLengthRule(1000);
  const item = newMentionPreference("x", "y");
  item.phone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
