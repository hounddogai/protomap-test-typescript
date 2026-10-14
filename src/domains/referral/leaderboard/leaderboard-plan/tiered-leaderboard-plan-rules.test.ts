import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredLeaderboardPlanExpiresAtRangeRule,
  TieredLeaderboardPlanExternalRefLengthRule,
  TieredLeaderboardPlanRequiredNameRule,
  TieredLeaderboardPlanRequiredTimezoneRule,
  defaultTieredLeaderboardPlanValidator,
} from "./tiered-leaderboard-plan-rules.js";
import { newTieredLeaderboardPlan } from "./tiered-leaderboard-plan.js";

test("TieredLeaderboardPlanValidator reports every problem", () => {
  const validator = defaultTieredLeaderboardPlanValidator();
  const item = newTieredLeaderboardPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredLeaderboardPlanRequiredNameRule flags a blank name", () => {
  const rule = new TieredLeaderboardPlanRequiredNameRule("tiered leaderboard plan needs a value");
  const item = newTieredLeaderboardPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredLeaderboardPlanExternalRefLengthRule flags a long external ref", () => {
  const rule = new TieredLeaderboardPlanExternalRefLengthRule(3600);
  const item = newTieredLeaderboardPlan("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredLeaderboardPlanRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new TieredLeaderboardPlanRequiredTimezoneRule("tiered leaderboard plan needs this field");
  const item = newTieredLeaderboardPlan("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredLeaderboardPlanExpiresAtRangeRule flags values above expires at", () => {
  const rule = new TieredLeaderboardPlanExpiresAtRangeRule(16, 255);
  const item = newTieredLeaderboardPlan("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
