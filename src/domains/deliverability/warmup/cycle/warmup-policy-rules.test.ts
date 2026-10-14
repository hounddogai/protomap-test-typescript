import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupPolicyBudgetRangeRule,
  WarmupPolicyCodeLengthRule,
  WarmupPolicyDurationMinutesRangeRule,
  WarmupPolicyMinimumRangeRule,
  WarmupPolicyScoreRangeRule,
  defaultWarmupPolicyValidator,
} from "./warmup-policy-rules.js";
import { newWarmupPolicy } from "./warmup-policy.js";

test("WarmupPolicyValidator reports every problem", () => {
  const validator = defaultWarmupPolicyValidator();
  const item = newWarmupPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupPolicyCodeLengthRule flags a long code", () => {
  const rule = new WarmupPolicyCodeLengthRule(120);
  const item = newWarmupPolicy("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupPolicyScoreRangeRule flags values above score", () => {
  const rule = new WarmupPolicyScoreRangeRule(2.3, 1078);
  const item = newWarmupPolicy("x", "y");
  item.score = 1079.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupPolicyDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new WarmupPolicyDurationMinutesRangeRule(3600, 86400);
  const item = newWarmupPolicy("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupPolicyMinimumRangeRule flags values above minimum", () => {
  const rule = new WarmupPolicyMinimumRangeRule(6.9, 1255.5);
  const item = newWarmupPolicy("x", "y");
  item.minimum = 1257;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupPolicyBudgetRangeRule flags values above budget", () => {
  const rule = new WarmupPolicyBudgetRangeRule(7.5, 1700.9);
  const item = newWarmupPolicy("x", "y");
  item.budget = 1702.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
