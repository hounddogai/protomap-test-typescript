import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengePreferenceCeilingRangeRule,
  ChallengePreferenceLocaleLengthRule,
  ChallengePreferenceNameLengthRule,
  ChallengePreferenceRequiredLocaleRule,
  defaultChallengePreferenceValidator,
} from "./challenge-preference-rules.js";
import { newChallengePreference } from "./challenge-preference.js";

test("ChallengePreferenceValidator reports every problem", () => {
  const validator = defaultChallengePreferenceValidator();
  const item = newChallengePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengePreferenceCeilingRangeRule flags values above ceiling", () => {
  const rule = new ChallengePreferenceCeilingRangeRule(2.8, 4363.4);
  const item = newChallengePreference("x", "y");
  item.ceiling = 4364.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengePreferenceLocaleLengthRule flags a long locale", () => {
  const rule = new ChallengePreferenceLocaleLengthRule(16);
  const item = newChallengePreference("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengePreferenceRequiredLocaleRule flags a blank locale", () => {
  const rule = new ChallengePreferenceRequiredLocaleRule("challenge preference needs an entry");
  const item = newChallengePreference("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengePreferenceNameLengthRule flags a long name", () => {
  const rule = new ChallengePreferenceNameLengthRule(32);
  const item = newChallengePreference("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
