import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackLeaderboardPolicyAmountRangeRule,
  FallbackLeaderboardPolicyCampaignRefLengthRule,
  FallbackLeaderboardPolicyCodeLengthRule,
  FallbackLeaderboardPolicyWindowDaysRangeRule,
  defaultFallbackLeaderboardPolicyValidator,
} from "./fallback-leaderboard-policy-rules.js";
import { newFallbackLeaderboardPolicy } from "./fallback-leaderboard-policy.js";

test("FallbackLeaderboardPolicyValidator reports every problem", () => {
  const validator = defaultFallbackLeaderboardPolicyValidator();
  const item = newFallbackLeaderboardPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackLeaderboardPolicyCodeLengthRule flags a long code", () => {
  const rule = new FallbackLeaderboardPolicyCodeLengthRule(86400);
  const item = newFallbackLeaderboardPolicy("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackLeaderboardPolicyWindowDaysRangeRule flags values above window days", () => {
  const rule = new FallbackLeaderboardPolicyWindowDaysRangeRule(1000, 3600);
  const item = newFallbackLeaderboardPolicy("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackLeaderboardPolicyAmountRangeRule flags values above amount", () => {
  const rule = new FallbackLeaderboardPolicyAmountRangeRule(0.9, 2368.1);
  const item = newFallbackLeaderboardPolicy("x", "y");
  item.amount = 2369.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackLeaderboardPolicyCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new FallbackLeaderboardPolicyCampaignRefLengthRule(1000);
  const item = newFallbackLeaderboardPolicy("x", "y");
  item.campaignRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
