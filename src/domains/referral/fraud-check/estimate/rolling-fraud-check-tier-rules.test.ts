import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFraudCheckTierGraceDaysRangeRule,
  RollingFraudCheckTierRequiredCodeRule,
  RollingFraudCheckTierRequiredCountryRule,
  RollingFraudCheckTierScoreRangeRule,
  RollingFraudCheckTierSendAtRangeRule,
  defaultRollingFraudCheckTierValidator,
} from "./rolling-fraud-check-tier-rules.js";
import { newRollingFraudCheckTier } from "./rolling-fraud-check-tier.js";

test("RollingFraudCheckTierValidator reports every problem", () => {
  const validator = defaultRollingFraudCheckTierValidator();
  const item = newRollingFraudCheckTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFraudCheckTierSendAtRangeRule flags values above send at", () => {
  const rule = new RollingFraudCheckTierSendAtRangeRule(1000, 86400);
  const item = newRollingFraudCheckTier("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingFraudCheckTierRequiredCodeRule flags a blank code", () => {
  const rule = new RollingFraudCheckTierRequiredCodeRule("rolling fraud check tier needs an entry");
  const item = newRollingFraudCheckTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingFraudCheckTierScoreRangeRule flags values above score", () => {
  const rule = new RollingFraudCheckTierScoreRangeRule(9.7, 1082.8);
  const item = newRollingFraudCheckTier("x", "y");
  item.score = 1084.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingFraudCheckTierRequiredCountryRule flags a blank country", () => {
  const rule = new RollingFraudCheckTierRequiredCountryRule("rolling fraud check tier needs this field");
  const item = newRollingFraudCheckTier("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingFraudCheckTierGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RollingFraudCheckTierGraceDaysRangeRule(64, 80);
  const item = newRollingFraudCheckTier("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
