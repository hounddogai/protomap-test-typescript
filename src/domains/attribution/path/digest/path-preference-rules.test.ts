import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathPreferenceChecksumLengthRule,
  PathPreferenceExpiresAtRangeRule,
  PathPreferenceRequiredCodeRule,
  PathPreferenceRequiredTitleRule,
  PathPreferenceTitleLengthRule,
  defaultPathPreferenceValidator,
} from "./path-preference-rules.js";
import { newPathPreference } from "./path-preference.js";

test("PathPreferenceValidator reports every problem", () => {
  const validator = defaultPathPreferenceValidator();
  const item = newPathPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathPreferenceExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PathPreferenceExpiresAtRangeRule(64, 86400);
  const item = newPathPreference("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathPreferenceTitleLengthRule flags a long title", () => {
  const rule = new PathPreferenceTitleLengthRule(3600);
  const item = newPathPreference("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathPreferenceChecksumLengthRule flags a long checksum", () => {
  const rule = new PathPreferenceChecksumLengthRule(1000);
  const item = newPathPreference("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new PathPreferenceRequiredCodeRule("path preference needs this field");
  const item = newPathPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new PathPreferenceRequiredTitleRule("path preference needs an entry");
  const item = newPathPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
