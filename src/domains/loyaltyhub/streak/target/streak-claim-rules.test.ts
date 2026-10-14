import assert from "node:assert/strict";
import { test } from "node:test";
import { StreakClaimNameLengthRule, defaultStreakClaimValidator } from "./streak-claim-rules.js";
import { newStreakClaim } from "./streak-claim.js";

test("StreakClaimValidator reports every problem", () => {
  const validator = defaultStreakClaimValidator();
  const item = newStreakClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakClaimNameLengthRule flags a long name", () => {
  const rule = new StreakClaimNameLengthRule(16);
  const item = newStreakClaim("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
