import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalPreferenceTierFrequencyCapRangeRule,
  GlobalPreferenceTierRequiredReviewerRule,
  defaultGlobalPreferenceTierValidator,
} from "./global-preference-tier-rules.js";
import { newGlobalPreferenceTier } from "./global-preference-tier.js";

test("GlobalPreferenceTierValidator reports every problem", () => {
  const validator = defaultGlobalPreferenceTierValidator();
  const item = newGlobalPreferenceTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalPreferenceTierFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new GlobalPreferenceTierFrequencyCapRangeRule(32, 86400);
  const item = newGlobalPreferenceTier("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalPreferenceTierRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new GlobalPreferenceTierRequiredReviewerRule("global preference tier needs this field");
  const item = newGlobalPreferenceTier("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
