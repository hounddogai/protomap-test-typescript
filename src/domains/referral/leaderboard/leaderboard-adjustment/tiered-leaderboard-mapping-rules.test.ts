import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredLeaderboardMappingCodeLengthRule,
  TieredLeaderboardMappingRequiredLabelRule,
  TieredLeaderboardMappingSequenceRangeRule,
  defaultTieredLeaderboardMappingValidator,
} from "./tiered-leaderboard-mapping-rules.js";
import { newTieredLeaderboardMapping } from "./tiered-leaderboard-mapping.js";

test("TieredLeaderboardMappingValidator reports every problem", () => {
  const validator = defaultTieredLeaderboardMappingValidator();
  const item = newTieredLeaderboardMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredLeaderboardMappingCodeLengthRule flags a long code", () => {
  const rule = new TieredLeaderboardMappingCodeLengthRule(1000);
  const item = newTieredLeaderboardMapping("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredLeaderboardMappingSequenceRangeRule flags values above sequence", () => {
  const rule = new TieredLeaderboardMappingSequenceRangeRule(3600, 86400);
  const item = newTieredLeaderboardMapping("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredLeaderboardMappingRequiredLabelRule flags a blank label", () => {
  const rule = new TieredLeaderboardMappingRequiredLabelRule("tiered leaderboard mapping needs a value");
  const item = newTieredLeaderboardMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
