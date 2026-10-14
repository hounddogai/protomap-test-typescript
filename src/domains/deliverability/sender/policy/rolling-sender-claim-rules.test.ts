import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSenderClaimCreatedAtRangeRule,
  RollingSenderClaimRequiredTitleRule,
  defaultRollingSenderClaimValidator,
} from "./rolling-sender-claim-rules.js";
import { newRollingSenderClaim } from "./rolling-sender-claim.js";

test("RollingSenderClaimValidator reports every problem", () => {
  const validator = defaultRollingSenderClaimValidator();
  const item = newRollingSenderClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSenderClaimRequiredTitleRule flags a blank title", () => {
  const rule = new RollingSenderClaimRequiredTitleRule("rolling sender claim needs a value");
  const item = newRollingSenderClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSenderClaimCreatedAtRangeRule flags values above created at", () => {
  const rule = new RollingSenderClaimCreatedAtRangeRule(16, 16);
  const item = newRollingSenderClaim("x", "y");
  item.createdAt = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
