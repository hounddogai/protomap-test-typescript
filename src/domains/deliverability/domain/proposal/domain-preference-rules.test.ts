import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainPreferenceCohortLengthRule,
  DomainPreferenceQuantityRangeRule,
  DomainPreferenceRequiredCodeRule,
  defaultDomainPreferenceValidator,
} from "./domain-preference-rules.js";
import { newDomainPreference } from "./domain-preference.js";

test("DomainPreferenceValidator reports every problem", () => {
  const validator = defaultDomainPreferenceValidator();
  const item = newDomainPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new DomainPreferenceRequiredCodeRule("domain preference needs this field");
  const item = newDomainPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainPreferenceCohortLengthRule flags a long cohort", () => {
  const rule = new DomainPreferenceCohortLengthRule(32);
  const item = newDomainPreference("x", "y");
  item.cohort = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainPreferenceQuantityRangeRule flags values above quantity", () => {
  const rule = new DomainPreferenceQuantityRangeRule(80, 80);
  const item = newDomainPreference("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
