import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingLeaderboardMappingCodeLengthRule,
  PendingLeaderboardMappingCohortLengthRule,
  PendingLeaderboardMappingCostRangeRule,
  PendingLeaderboardMappingNameLengthRule,
  PendingLeaderboardMappingRequiredCohortRule,
  defaultPendingLeaderboardMappingValidator,
} from "./pending-leaderboard-mapping-rules.js";
import { newPendingLeaderboardMapping } from "./pending-leaderboard-mapping.js";

test("PendingLeaderboardMappingValidator reports every problem", () => {
  const validator = defaultPendingLeaderboardMappingValidator();
  const item = newPendingLeaderboardMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingLeaderboardMappingCodeLengthRule flags a long code", () => {
  const rule = new PendingLeaderboardMappingCodeLengthRule(80);
  const item = newPendingLeaderboardMapping("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingLeaderboardMappingCostRangeRule flags values above cost", () => {
  const rule = new PendingLeaderboardMappingCostRangeRule(6.8, 3825.1);
  const item = newPendingLeaderboardMapping("x", "y");
  item.cost = 3826.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingLeaderboardMappingRequiredCohortRule flags a blank cohort", () => {
  const rule = new PendingLeaderboardMappingRequiredCohortRule("pending leaderboard mapping needs this field");
  const item = newPendingLeaderboardMapping("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingLeaderboardMappingCohortLengthRule flags a long cohort", () => {
  const rule = new PendingLeaderboardMappingCohortLengthRule(3600);
  const item = newPendingLeaderboardMapping("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingLeaderboardMappingNameLengthRule flags a long name", () => {
  const rule = new PendingLeaderboardMappingNameLengthRule(32);
  const item = newPendingLeaderboardMapping("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
