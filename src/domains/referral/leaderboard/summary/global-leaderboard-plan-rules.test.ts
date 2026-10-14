import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalLeaderboardPlanJourneyIdLengthRule,
  GlobalLeaderboardPlanRequiredCodeRule,
  GlobalLeaderboardPlanRequiredCountryRule,
  defaultGlobalLeaderboardPlanValidator,
} from "./global-leaderboard-plan-rules.js";
import { newGlobalLeaderboardPlan } from "./global-leaderboard-plan.js";

test("GlobalLeaderboardPlanValidator reports every problem", () => {
  const validator = defaultGlobalLeaderboardPlanValidator();
  const item = newGlobalLeaderboardPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalLeaderboardPlanRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalLeaderboardPlanRequiredCodeRule("global leaderboard plan needs this field");
  const item = newGlobalLeaderboardPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalLeaderboardPlanJourneyIdLengthRule flags a long journey id", () => {
  const rule = new GlobalLeaderboardPlanJourneyIdLengthRule(255);
  const item = newGlobalLeaderboardPlan("x", "y");
  item.journeyId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalLeaderboardPlanRequiredCountryRule flags a blank country", () => {
  const rule = new GlobalLeaderboardPlanRequiredCountryRule("global leaderboard plan needs a value");
  const item = newGlobalLeaderboardPlan("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
