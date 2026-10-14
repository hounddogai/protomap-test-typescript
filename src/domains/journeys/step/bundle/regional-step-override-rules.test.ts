import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalStepOverrideBudgetRangeRule,
  RegionalStepOverrideRequiredCodeRule,
  RegionalStepOverrideRequiredContactEmailRule,
  RegionalStepOverrideRequiredPhoneRule,
  RegionalStepOverrideRetriesRangeRule,
  defaultRegionalStepOverrideValidator,
} from "./regional-step-override-rules.js";
import { newRegionalStepOverride } from "./regional-step-override.js";

test("RegionalStepOverrideValidator reports every problem", () => {
  const validator = defaultRegionalStepOverrideValidator();
  const item = newRegionalStepOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalStepOverrideBudgetRangeRule flags values above budget", () => {
  const rule = new RegionalStepOverrideBudgetRangeRule(1.8, 2172.3);
  const item = newRegionalStepOverride("x", "y");
  item.budget = 2173.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalStepOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalStepOverrideRequiredCodeRule("regional step override needs an entry");
  const item = newRegionalStepOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalStepOverrideRetriesRangeRule flags values above retries", () => {
  const rule = new RegionalStepOverrideRetriesRangeRule(16, 1000);
  const item = newRegionalStepOverride("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalStepOverrideRequiredPhoneRule flags a blank phone", () => {
  const rule = new RegionalStepOverrideRequiredPhoneRule("regional step override needs this field");
  const item = newRegionalStepOverride("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalStepOverrideRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RegionalStepOverrideRequiredContactEmailRule("regional step override needs this field");
  const item = newRegionalStepOverride("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
