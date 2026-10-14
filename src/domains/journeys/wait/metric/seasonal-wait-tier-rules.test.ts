import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalWaitTierCodeLengthRule,
  SeasonalWaitTierCreatedAtRangeRule,
  SeasonalWaitTierRequiredChannelRule,
  SeasonalWaitTierRequiredUnitRule,
  SeasonalWaitTierRetriesRangeRule,
  defaultSeasonalWaitTierValidator,
} from "./seasonal-wait-tier-rules.js";
import { newSeasonalWaitTier } from "./seasonal-wait-tier.js";

test("SeasonalWaitTierValidator reports every problem", () => {
  const validator = defaultSeasonalWaitTierValidator();
  const item = newSeasonalWaitTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalWaitTierRetriesRangeRule flags values above retries", () => {
  const rule = new SeasonalWaitTierRetriesRangeRule(3600, 86400);
  const item = newSeasonalWaitTier("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalWaitTierCodeLengthRule flags a long code", () => {
  const rule = new SeasonalWaitTierCodeLengthRule(1000);
  const item = newSeasonalWaitTier("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalWaitTierRequiredUnitRule flags a blank unit", () => {
  const rule = new SeasonalWaitTierRequiredUnitRule("seasonal wait tier needs a value");
  const item = newSeasonalWaitTier("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalWaitTierCreatedAtRangeRule flags values above created at", () => {
  const rule = new SeasonalWaitTierCreatedAtRangeRule(80, 1000);
  const item = newSeasonalWaitTier("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalWaitTierRequiredChannelRule flags a blank channel", () => {
  const rule = new SeasonalWaitTierRequiredChannelRule("seasonal wait tier needs an entry");
  const item = newSeasonalWaitTier("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
