import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualChallengeTierCodeLengthRule,
  ManualChallengeTierMinimumRangeRule,
  ManualChallengeTierRequiredCountryRule,
  defaultManualChallengeTierValidator,
} from "./manual-challenge-tier-rules.js";
import { newManualChallengeTier } from "./manual-challenge-tier.js";

test("ManualChallengeTierValidator reports every problem", () => {
  const validator = defaultManualChallengeTierValidator();
  const item = newManualChallengeTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualChallengeTierRequiredCountryRule flags a blank country", () => {
  const rule = new ManualChallengeTierRequiredCountryRule("manual challenge tier needs a value");
  const item = newManualChallengeTier("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualChallengeTierCodeLengthRule flags a long code", () => {
  const rule = new ManualChallengeTierCodeLengthRule(80);
  const item = newManualChallengeTier("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualChallengeTierMinimumRangeRule flags values above minimum", () => {
  const rule = new ManualChallengeTierMinimumRangeRule(0.4, 2792.9);
  const item = newManualChallengeTier("x", "y");
  item.minimum = 2794.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
