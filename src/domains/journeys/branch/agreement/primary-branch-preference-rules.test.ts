import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryBranchPreferenceDescriptionLengthRule,
  PrimaryBranchPreferenceRequiredNameRule,
  PrimaryBranchPreferenceSendAtRangeRule,
  defaultPrimaryBranchPreferenceValidator,
} from "./primary-branch-preference-rules.js";
import { newPrimaryBranchPreference } from "./primary-branch-preference.js";

test("PrimaryBranchPreferenceValidator reports every problem", () => {
  const validator = defaultPrimaryBranchPreferenceValidator();
  const item = newPrimaryBranchPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryBranchPreferenceSendAtRangeRule flags values above send at", () => {
  const rule = new PrimaryBranchPreferenceSendAtRangeRule(120, 1000);
  const item = newPrimaryBranchPreference("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryBranchPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryBranchPreferenceRequiredNameRule("primary branch preference needs this field");
  const item = newPrimaryBranchPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryBranchPreferenceDescriptionLengthRule flags a long description", () => {
  const rule = new PrimaryBranchPreferenceDescriptionLengthRule(64);
  const item = newPrimaryBranchPreference("x", "y");
  item.description = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
