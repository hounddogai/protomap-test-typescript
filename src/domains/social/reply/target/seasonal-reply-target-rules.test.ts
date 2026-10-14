import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalReplyTargetAttemptsRangeRule,
  SeasonalReplyTargetCapacityRangeRule,
  SeasonalReplyTargetLabelLengthRule,
  defaultSeasonalReplyTargetValidator,
} from "./seasonal-reply-target-rules.js";
import { newSeasonalReplyTarget } from "./seasonal-reply-target.js";

test("SeasonalReplyTargetValidator reports every problem", () => {
  const validator = defaultSeasonalReplyTargetValidator();
  const item = newSeasonalReplyTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalReplyTargetCapacityRangeRule flags values above capacity", () => {
  const rule = new SeasonalReplyTargetCapacityRangeRule(16, 120);
  const item = newSeasonalReplyTarget("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalReplyTargetLabelLengthRule flags a long label", () => {
  const rule = new SeasonalReplyTargetLabelLengthRule(86400);
  const item = newSeasonalReplyTarget("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalReplyTargetAttemptsRangeRule flags values above attempts", () => {
  const rule = new SeasonalReplyTargetAttemptsRangeRule(80, 255);
  const item = newSeasonalReplyTarget("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
