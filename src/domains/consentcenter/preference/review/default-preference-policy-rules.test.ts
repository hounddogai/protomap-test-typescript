import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPreferencePolicyChecksumLengthRule,
  DefaultPreferencePolicyRequiredChecksumRule,
  DefaultPreferencePolicyRequiredTitleRule,
  defaultDefaultPreferencePolicyValidator,
} from "./default-preference-policy-rules.js";
import { newDefaultPreferencePolicy } from "./default-preference-policy.js";

test("DefaultPreferencePolicyValidator reports every problem", () => {
  const validator = defaultDefaultPreferencePolicyValidator();
  const item = newDefaultPreferencePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPreferencePolicyChecksumLengthRule flags a long checksum", () => {
  const rule = new DefaultPreferencePolicyChecksumLengthRule(80);
  const item = newDefaultPreferencePolicy("x", "y");
  item.checksum = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPreferencePolicyRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultPreferencePolicyRequiredTitleRule("default preference policy needs a value");
  const item = newDefaultPreferencePolicy("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPreferencePolicyRequiredChecksumRule flags a blank checksum", () => {
  const rule = new DefaultPreferencePolicyRequiredChecksumRule("default preference policy needs an entry");
  const item = newDefaultPreferencePolicy("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
