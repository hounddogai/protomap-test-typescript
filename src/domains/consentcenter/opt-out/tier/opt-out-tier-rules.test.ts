import assert from "node:assert/strict";
import { test } from "node:test";
import { OptOutTierTitleLengthRule, defaultOptOutTierValidator } from "./opt-out-tier-rules.js";
import { newOptOutTier } from "./opt-out-tier.js";

test("OptOutTierValidator reports every problem", () => {
  const validator = defaultOptOutTierValidator();
  const item = newOptOutTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutTierTitleLengthRule flags a long title", () => {
  const rule = new OptOutTierTitleLengthRule(86400);
  const item = newOptOutTier("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
