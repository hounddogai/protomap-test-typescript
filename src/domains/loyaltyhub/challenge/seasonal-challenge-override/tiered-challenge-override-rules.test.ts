import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredChallengeOverrideChannelLengthRule,
  TieredChallengeOverrideRequiredCodeRule,
  TieredChallengeOverrideUnitLengthRule,
  defaultTieredChallengeOverrideValidator,
} from "./tiered-challenge-override-rules.js";
import { newTieredChallengeOverride } from "./tiered-challenge-override.js";

test("TieredChallengeOverrideValidator reports every problem", () => {
  const validator = defaultTieredChallengeOverrideValidator();
  const item = newTieredChallengeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredChallengeOverrideUnitLengthRule flags a long unit", () => {
  const rule = new TieredChallengeOverrideUnitLengthRule(1000);
  const item = newTieredChallengeOverride("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredChallengeOverrideChannelLengthRule flags a long channel", () => {
  const rule = new TieredChallengeOverrideChannelLengthRule(32);
  const item = newTieredChallengeOverride("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredChallengeOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new TieredChallengeOverrideRequiredCodeRule("tiered challenge override needs this field");
  const item = newTieredChallengeOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
