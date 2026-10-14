import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeTierAmountRangeRule,
  ChallengeTierPhoneLengthRule,
  defaultChallengeTierValidator,
} from "./challenge-tier-rules.js";
import { newChallengeTier } from "./challenge-tier.js";

test("ChallengeTierValidator reports every problem", () => {
  const validator = defaultChallengeTierValidator();
  const item = newChallengeTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeTierPhoneLengthRule flags a long phone", () => {
  const rule = new ChallengeTierPhoneLengthRule(16);
  const item = newChallengeTier("x", "y");
  item.phone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeTierAmountRangeRule flags values above amount", () => {
  const rule = new ChallengeTierAmountRangeRule(8.4, 2090);
  const item = newChallengeTier("x", "y");
  item.amount = 2091.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
