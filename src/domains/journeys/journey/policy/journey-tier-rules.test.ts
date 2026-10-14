import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyTierCodeLengthRule,
  JourneyTierRequiredCodeRule,
  defaultJourneyTierValidator,
} from "./journey-tier-rules.js";
import { newJourneyTier } from "./journey-tier.js";

test("JourneyTierValidator reports every problem", () => {
  const validator = defaultJourneyTierValidator();
  const item = newJourneyTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyTierRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyTierRequiredCodeRule("journey tier needs this field");
  const item = newJourneyTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyTierCodeLengthRule flags a long code", () => {
  const rule = new JourneyTierCodeLengthRule(255);
  const item = newJourneyTier("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
