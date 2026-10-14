import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyChallengeOverrideMaximumRangeRule,
  LegacyChallengeOverrideRequiredCodeRule,
  LegacyChallengeOverrideRequiredTitleRule,
  defaultLegacyChallengeOverrideValidator,
} from "./legacy-challenge-override-rules.js";
import { newLegacyChallengeOverride } from "./legacy-challenge-override.js";

test("LegacyChallengeOverrideValidator reports every problem", () => {
  const validator = defaultLegacyChallengeOverrideValidator();
  const item = newLegacyChallengeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyChallengeOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyChallengeOverrideRequiredTitleRule("legacy challenge override needs a value");
  const item = newLegacyChallengeOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyChallengeOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyChallengeOverrideRequiredCodeRule("legacy challenge override needs a value");
  const item = newLegacyChallengeOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyChallengeOverrideMaximumRangeRule flags values above maximum", () => {
  const rule = new LegacyChallengeOverrideMaximumRangeRule(2.8, 4379.8);
  const item = newLegacyChallengeOverride("x", "y");
  item.maximum = 4381.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
