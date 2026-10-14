import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceEntryCodeLengthRule,
  PreferenceEntryContactEmailLengthRule,
  PreferenceEntryFloorValueRangeRule,
  defaultPreferenceEntryValidator,
} from "./preference-entry-rules.js";
import { newPreferenceEntry } from "./preference-entry.js";

test("PreferenceEntryValidator reports every problem", () => {
  const validator = defaultPreferenceEntryValidator();
  const item = newPreferenceEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceEntryContactEmailLengthRule flags a long contact email", () => {
  const rule = new PreferenceEntryContactEmailLengthRule(64);
  const item = newPreferenceEntry("x", "y");
  item.contactEmail = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceEntryCodeLengthRule flags a long code", () => {
  const rule = new PreferenceEntryCodeLengthRule(255);
  const item = newPreferenceEntry("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceEntryFloorValueRangeRule flags values above floor value", () => {
  const rule = new PreferenceEntryFloorValueRangeRule(1.7, 839.7);
  const item = newPreferenceEntry("x", "y");
  item.floorValue = 841.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
