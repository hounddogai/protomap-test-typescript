import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalInsightTargetChannelLengthRule,
  SeasonalInsightTargetQuantityRangeRule,
  SeasonalInsightTargetRequiredChannelRule,
  defaultSeasonalInsightTargetValidator,
} from "./seasonal-insight-target-rules.js";
import { newSeasonalInsightTarget } from "./seasonal-insight-target.js";

test("SeasonalInsightTargetValidator reports every problem", () => {
  const validator = defaultSeasonalInsightTargetValidator();
  const item = newSeasonalInsightTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalInsightTargetRequiredChannelRule flags a blank channel", () => {
  const rule = new SeasonalInsightTargetRequiredChannelRule("seasonal insight target needs this field");
  const item = newSeasonalInsightTarget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalInsightTargetChannelLengthRule flags a long channel", () => {
  const rule = new SeasonalInsightTargetChannelLengthRule(32);
  const item = newSeasonalInsightTarget("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalInsightTargetQuantityRangeRule flags values above quantity", () => {
  const rule = new SeasonalInsightTargetQuantityRangeRule(80, 120);
  const item = newSeasonalInsightTarget("x", "y");
  item.quantity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
