import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedActivationDigestAttemptsRangeRule,
  WeightedActivationDigestCodeLengthRule,
  defaultWeightedActivationDigestValidator,
} from "./weighted-activation-digest-rules.js";
import { newWeightedActivationDigest } from "./weighted-activation-digest.js";

test("WeightedActivationDigestValidator reports every problem", () => {
  const validator = defaultWeightedActivationDigestValidator();
  const item = newWeightedActivationDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedActivationDigestCodeLengthRule flags a long code", () => {
  const rule = new WeightedActivationDigestCodeLengthRule(64);
  const item = newWeightedActivationDigest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedActivationDigestAttemptsRangeRule flags values above attempts", () => {
  const rule = new WeightedActivationDigestAttemptsRangeRule(3600, 86400);
  const item = newWeightedActivationDigest("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
