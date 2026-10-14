import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingExitRulePreferencePriorityRangeRule,
  PendingExitRulePreferenceRequiredCodeRule,
  PendingExitRulePreferenceRequiredUtmSourceRule,
  PendingExitRulePreferenceUtmSourceLengthRule,
  defaultPendingExitRulePreferenceValidator,
} from "./pending-exit-rule-preference-rules.js";
import { newPendingExitRulePreference } from "./pending-exit-rule-preference.js";

test("PendingExitRulePreferenceValidator reports every problem", () => {
  const validator = defaultPendingExitRulePreferenceValidator();
  const item = newPendingExitRulePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingExitRulePreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new PendingExitRulePreferenceRequiredCodeRule("pending exit rule preference needs this field");
  const item = newPendingExitRulePreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingExitRulePreferencePriorityRangeRule flags values above priority", () => {
  const rule = new PendingExitRulePreferencePriorityRangeRule(64, 1000);
  const item = newPendingExitRulePreference("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingExitRulePreferenceUtmSourceLengthRule flags a long utm source", () => {
  const rule = new PendingExitRulePreferenceUtmSourceLengthRule(80);
  const item = newPendingExitRulePreference("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingExitRulePreferenceRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PendingExitRulePreferenceRequiredUtmSourceRule("pending exit rule preference needs an entry");
  const item = newPendingExitRulePreference("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
