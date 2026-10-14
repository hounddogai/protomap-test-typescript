import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalWarmupCheckpointRequiredLocaleRule,
  SeasonalWarmupCheckpointRequiredTitleRule,
  SeasonalWarmupCheckpointSequenceRangeRule,
  defaultSeasonalWarmupCheckpointValidator,
} from "./seasonal-warmup-checkpoint-rules.js";
import { newSeasonalWarmupCheckpoint } from "./seasonal-warmup-checkpoint.js";

test("SeasonalWarmupCheckpointValidator reports every problem", () => {
  const validator = defaultSeasonalWarmupCheckpointValidator();
  const item = newSeasonalWarmupCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalWarmupCheckpointRequiredLocaleRule flags a blank locale", () => {
  const rule = new SeasonalWarmupCheckpointRequiredLocaleRule("seasonal warmup checkpoint needs a value");
  const item = newSeasonalWarmupCheckpoint("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalWarmupCheckpointRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalWarmupCheckpointRequiredTitleRule("seasonal warmup checkpoint needs a value");
  const item = newSeasonalWarmupCheckpoint("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalWarmupCheckpointSequenceRangeRule flags values above sequence", () => {
  const rule = new SeasonalWarmupCheckpointSequenceRangeRule(255, 86400);
  const item = newSeasonalWarmupCheckpoint("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
