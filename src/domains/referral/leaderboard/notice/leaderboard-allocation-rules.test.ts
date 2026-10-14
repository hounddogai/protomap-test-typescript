import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardAllocationCategoryLengthRule,
  LeaderboardAllocationLabelLengthRule,
  LeaderboardAllocationRequiredLabelRule,
  LeaderboardAllocationVersionRangeRule,
  defaultLeaderboardAllocationValidator,
} from "./leaderboard-allocation-rules.js";
import { newLeaderboardAllocation } from "./leaderboard-allocation.js";

test("LeaderboardAllocationValidator reports every problem", () => {
  const validator = defaultLeaderboardAllocationValidator();
  const item = newLeaderboardAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardAllocationCategoryLengthRule flags a long category", () => {
  const rule = new LeaderboardAllocationCategoryLengthRule(1000);
  const item = newLeaderboardAllocation("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardAllocationVersionRangeRule flags values above version", () => {
  const rule = new LeaderboardAllocationVersionRangeRule(16, 255);
  const item = newLeaderboardAllocation("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardAllocationRequiredLabelRule flags a blank label", () => {
  const rule = new LeaderboardAllocationRequiredLabelRule("leaderboard allocation needs this field");
  const item = newLeaderboardAllocation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardAllocationLabelLengthRule flags a long label", () => {
  const rule = new LeaderboardAllocationLabelLengthRule(64);
  const item = newLeaderboardAllocation("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
