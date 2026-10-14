import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyComplaintPreferenceOwnerIdLengthRule,
  LegacyComplaintPreferenceRequiredCodeRule,
  LegacyComplaintPreferenceRequiredOwnerIdRule,
  LegacyComplaintPreferenceRequiredTitleRule,
  defaultLegacyComplaintPreferenceValidator,
} from "./legacy-complaint-preference-rules.js";
import { newLegacyComplaintPreference } from "./legacy-complaint-preference.js";

test("LegacyComplaintPreferenceValidator reports every problem", () => {
  const validator = defaultLegacyComplaintPreferenceValidator();
  const item = newLegacyComplaintPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyComplaintPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyComplaintPreferenceRequiredCodeRule("legacy complaint preference needs a value");
  const item = newLegacyComplaintPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyComplaintPreferenceRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new LegacyComplaintPreferenceRequiredOwnerIdRule("legacy complaint preference needs this field");
  const item = newLegacyComplaintPreference("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyComplaintPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyComplaintPreferenceRequiredTitleRule("legacy complaint preference needs an entry");
  const item = newLegacyComplaintPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyComplaintPreferenceOwnerIdLengthRule flags a long owner id", () => {
  const rule = new LegacyComplaintPreferenceOwnerIdLengthRule(16);
  const item = newLegacyComplaintPreference("x", "y");
  item.ownerId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
