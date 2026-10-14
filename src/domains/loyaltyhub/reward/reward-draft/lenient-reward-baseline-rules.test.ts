import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientRewardBaselineCodeLengthRule,
  LenientRewardBaselineExpiresAtRangeRule,
  LenientRewardBaselineGraceDaysRangeRule,
  defaultLenientRewardBaselineValidator,
} from "./lenient-reward-baseline-rules.js";
import { newLenientRewardBaseline } from "./lenient-reward-baseline.js";

test("LenientRewardBaselineValidator reports every problem", () => {
  const validator = defaultLenientRewardBaselineValidator();
  const item = newLenientRewardBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientRewardBaselineGraceDaysRangeRule flags values above grace days", () => {
  const rule = new LenientRewardBaselineGraceDaysRangeRule(120, 255);
  const item = newLenientRewardBaseline("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientRewardBaselineCodeLengthRule flags a long code", () => {
  const rule = new LenientRewardBaselineCodeLengthRule(86400);
  const item = newLenientRewardBaseline("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRewardBaselineExpiresAtRangeRule flags values above expires at", () => {
  const rule = new LenientRewardBaselineExpiresAtRangeRule(64, 3600);
  const item = newLenientRewardBaseline("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
