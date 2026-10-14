import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyChallengeTargetCapacityRangeRule,
  LegacyChallengeTargetQuantityRangeRule,
  LegacyChallengeTargetRequiredLocaleRule,
  defaultLegacyChallengeTargetValidator,
} from "./legacy-challenge-target-rules.js";
import { newLegacyChallengeTarget } from "./legacy-challenge-target.js";

test("LegacyChallengeTargetValidator reports every problem", () => {
  const validator = defaultLegacyChallengeTargetValidator();
  const item = newLegacyChallengeTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyChallengeTargetRequiredLocaleRule flags a blank locale", () => {
  const rule = new LegacyChallengeTargetRequiredLocaleRule("legacy challenge target needs an entry");
  const item = newLegacyChallengeTarget("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyChallengeTargetQuantityRangeRule flags values above quantity", () => {
  const rule = new LegacyChallengeTargetQuantityRangeRule(16, 80);
  const item = newLegacyChallengeTarget("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyChallengeTargetCapacityRangeRule flags values above capacity", () => {
  const rule = new LegacyChallengeTargetCapacityRangeRule(120, 255);
  const item = newLegacyChallengeTarget("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
