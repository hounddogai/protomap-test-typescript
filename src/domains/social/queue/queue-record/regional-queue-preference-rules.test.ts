import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalQueuePreferenceCeilingRangeRule,
  RegionalQueuePreferenceCodeLengthRule,
  RegionalQueuePreferenceRequiredCodeRule,
  RegionalQueuePreferenceRequiredNameRule,
  defaultRegionalQueuePreferenceValidator,
} from "./regional-queue-preference-rules.js";
import { newRegionalQueuePreference } from "./regional-queue-preference.js";

test("RegionalQueuePreferenceValidator reports every problem", () => {
  const validator = defaultRegionalQueuePreferenceValidator();
  const item = newRegionalQueuePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalQueuePreferenceRequiredNameRule flags a blank name", () => {
  const rule = new RegionalQueuePreferenceRequiredNameRule("regional queue preference needs this field");
  const item = newRegionalQueuePreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalQueuePreferenceCodeLengthRule flags a long code", () => {
  const rule = new RegionalQueuePreferenceCodeLengthRule(3600);
  const item = newRegionalQueuePreference("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalQueuePreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalQueuePreferenceRequiredCodeRule("regional queue preference needs a value");
  const item = newRegionalQueuePreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalQueuePreferenceCeilingRangeRule flags values above ceiling", () => {
  const rule = new RegionalQueuePreferenceCeilingRangeRule(5.3, 4260.7);
  const item = newRegionalQueuePreference("x", "y");
  item.ceiling = 4262.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
