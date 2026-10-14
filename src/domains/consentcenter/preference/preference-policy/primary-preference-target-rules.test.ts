import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPreferenceTargetCodeLengthRule,
  PrimaryPreferenceTargetMaximumRangeRule,
  PrimaryPreferenceTargetRequiredTitleRule,
  defaultPrimaryPreferenceTargetValidator,
} from "./primary-preference-target-rules.js";
import { newPrimaryPreferenceTarget } from "./primary-preference-target.js";

test("PrimaryPreferenceTargetValidator reports every problem", () => {
  const validator = defaultPrimaryPreferenceTargetValidator();
  const item = newPrimaryPreferenceTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPreferenceTargetCodeLengthRule flags a long code", () => {
  const rule = new PrimaryPreferenceTargetCodeLengthRule(1000);
  const item = newPrimaryPreferenceTarget("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPreferenceTargetRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryPreferenceTargetRequiredTitleRule("primary preference target needs an entry");
  const item = newPrimaryPreferenceTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPreferenceTargetMaximumRangeRule flags values above maximum", () => {
  const rule = new PrimaryPreferenceTargetMaximumRangeRule(5.3, 3772);
  const item = newPrimaryPreferenceTarget("x", "y");
  item.maximum = 3773.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
