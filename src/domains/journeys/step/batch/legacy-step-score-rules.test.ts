import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyStepScoreCapacityRangeRule,
  LegacyStepScoreMaximumRangeRule,
  LegacyStepScoreRequiredChannelRule,
  LegacyStepScoreRequiredCodeRule,
  defaultLegacyStepScoreValidator,
} from "./legacy-step-score-rules.js";
import { newLegacyStepScore } from "./legacy-step-score.js";

test("LegacyStepScoreValidator reports every problem", () => {
  const validator = defaultLegacyStepScoreValidator();
  const item = newLegacyStepScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyStepScoreMaximumRangeRule flags values above maximum", () => {
  const rule = new LegacyStepScoreMaximumRangeRule(4.3, 1952.6);
  const item = newLegacyStepScore("x", "y");
  item.maximum = 1954.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyStepScoreRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyStepScoreRequiredCodeRule("legacy step score needs an entry");
  const item = newLegacyStepScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyStepScoreCapacityRangeRule flags values above capacity", () => {
  const rule = new LegacyStepScoreCapacityRangeRule(120, 3600);
  const item = newLegacyStepScore("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyStepScoreRequiredChannelRule flags a blank channel", () => {
  const rule = new LegacyStepScoreRequiredChannelRule("legacy step score needs an entry");
  const item = newLegacyStepScore("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
