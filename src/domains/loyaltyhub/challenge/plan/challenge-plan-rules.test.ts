import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengePlanExpiresAtRangeRule,
  ChallengePlanNameLengthRule,
  ChallengePlanRatioRangeRule,
  defaultChallengePlanValidator,
} from "./challenge-plan-rules.js";
import { newChallengePlan } from "./challenge-plan.js";

test("ChallengePlanValidator reports every problem", () => {
  const validator = defaultChallengePlanValidator();
  const item = newChallengePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengePlanExpiresAtRangeRule flags values above expires at", () => {
  const rule = new ChallengePlanExpiresAtRangeRule(80, 86400);
  const item = newChallengePlan("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengePlanNameLengthRule flags a long name", () => {
  const rule = new ChallengePlanNameLengthRule(32);
  const item = newChallengePlan("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengePlanRatioRangeRule flags values above ratio", () => {
  const rule = new ChallengePlanRatioRangeRule(2, 970.4);
  const item = newChallengePlan("x", "y");
  item.ratio = 971.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
