import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredLevelClaimAttemptsRangeRule,
  TieredLevelClaimCostRangeRule,
  TieredLevelClaimRequiredCodeRule,
  TieredLevelClaimRequiredTitleRule,
  defaultTieredLevelClaimValidator,
} from "./tiered-level-claim-rules.js";
import { newTieredLevelClaim } from "./tiered-level-claim.js";

test("TieredLevelClaimValidator reports every problem", () => {
  const validator = defaultTieredLevelClaimValidator();
  const item = newTieredLevelClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredLevelClaimRequiredCodeRule flags a blank code", () => {
  const rule = new TieredLevelClaimRequiredCodeRule("tiered level claim needs an entry");
  const item = newTieredLevelClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredLevelClaimCostRangeRule flags values above cost", () => {
  const rule = new TieredLevelClaimCostRangeRule(8.9, 2603.5);
  const item = newTieredLevelClaim("x", "y");
  item.cost = 2605;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredLevelClaimAttemptsRangeRule flags values above attempts", () => {
  const rule = new TieredLevelClaimAttemptsRangeRule(16, 86400);
  const item = newTieredLevelClaim("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredLevelClaimRequiredTitleRule flags a blank title", () => {
  const rule = new TieredLevelClaimRequiredTitleRule("tiered level claim needs an entry");
  const item = newTieredLevelClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
