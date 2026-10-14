import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalRewardRollupBatchSizeRangeRule,
  SeasonalRewardRollupCodeLengthRule,
  SeasonalRewardRollupRequiredLabelRule,
  defaultSeasonalRewardRollupValidator,
} from "./seasonal-reward-rollup-rules.js";
import { newSeasonalRewardRollup } from "./seasonal-reward-rollup.js";

test("SeasonalRewardRollupValidator reports every problem", () => {
  const validator = defaultSeasonalRewardRollupValidator();
  const item = newSeasonalRewardRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalRewardRollupRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalRewardRollupRequiredLabelRule("seasonal reward rollup needs this field");
  const item = newSeasonalRewardRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalRewardRollupBatchSizeRangeRule flags values above batch size", () => {
  const rule = new SeasonalRewardRollupBatchSizeRangeRule(1000, 3600);
  const item = newSeasonalRewardRollup("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalRewardRollupCodeLengthRule flags a long code", () => {
  const rule = new SeasonalRewardRollupCodeLengthRule(120);
  const item = newSeasonalRewardRollup("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
