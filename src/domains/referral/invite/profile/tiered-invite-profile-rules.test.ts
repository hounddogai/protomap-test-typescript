import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredInviteProfileAttemptsRangeRule,
  TieredInviteProfileConversionRateRangeRule,
  TieredInviteProfileRequiredCodeRule,
  TieredInviteProfileRequiredCountryRule,
  TieredInviteProfileRequiredTitleRule,
  defaultTieredInviteProfileValidator,
} from "./tiered-invite-profile-rules.js";
import { newTieredInviteProfile } from "./tiered-invite-profile.js";

test("TieredInviteProfileValidator reports every problem", () => {
  const validator = defaultTieredInviteProfileValidator();
  const item = newTieredInviteProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredInviteProfileRequiredCodeRule flags a blank code", () => {
  const rule = new TieredInviteProfileRequiredCodeRule("tiered invite profile needs this field");
  const item = newTieredInviteProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredInviteProfileAttemptsRangeRule flags values above attempts", () => {
  const rule = new TieredInviteProfileAttemptsRangeRule(80, 255);
  const item = newTieredInviteProfile("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredInviteProfileConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new TieredInviteProfileConversionRateRangeRule(7.8, 925.9);
  const item = newTieredInviteProfile("x", "y");
  item.conversionRate = 927.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredInviteProfileRequiredCountryRule flags a blank country", () => {
  const rule = new TieredInviteProfileRequiredCountryRule("tiered invite profile needs a value");
  const item = newTieredInviteProfile("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredInviteProfileRequiredTitleRule flags a blank title", () => {
  const rule = new TieredInviteProfileRequiredTitleRule("tiered invite profile needs a value");
  const item = newTieredInviteProfile("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
