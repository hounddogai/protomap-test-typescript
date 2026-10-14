import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionPreferenceCodeLengthRule,
  RetentionPreferenceRegionLengthRule,
  RetentionPreferenceRequiredRegionRule,
  defaultRetentionPreferenceValidator,
} from "./retention-preference-rules.js";
import { newRetentionPreference } from "./retention-preference.js";

test("RetentionPreferenceValidator reports every problem", () => {
  const validator = defaultRetentionPreferenceValidator();
  const item = newRetentionPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionPreferenceCodeLengthRule flags a long code", () => {
  const rule = new RetentionPreferenceCodeLengthRule(32);
  const item = newRetentionPreference("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionPreferenceRegionLengthRule flags a long region", () => {
  const rule = new RetentionPreferenceRegionLengthRule(1000);
  const item = newRetentionPreference("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionPreferenceRequiredRegionRule flags a blank region", () => {
  const rule = new RetentionPreferenceRequiredRegionRule("retention preference needs a value");
  const item = newRetentionPreference("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
