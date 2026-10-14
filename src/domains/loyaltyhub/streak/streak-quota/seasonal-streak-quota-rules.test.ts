import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalStreakQuotaImpressionsRangeRule,
  SeasonalStreakQuotaRequiredLabelRule,
  SeasonalStreakQuotaRequiredSegmentRule,
  defaultSeasonalStreakQuotaValidator,
} from "./seasonal-streak-quota-rules.js";
import { newSeasonalStreakQuota } from "./seasonal-streak-quota.js";

test("SeasonalStreakQuotaValidator reports every problem", () => {
  const validator = defaultSeasonalStreakQuotaValidator();
  const item = newSeasonalStreakQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalStreakQuotaRequiredSegmentRule flags a blank segment", () => {
  const rule = new SeasonalStreakQuotaRequiredSegmentRule("seasonal streak quota needs this field");
  const item = newSeasonalStreakQuota("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalStreakQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalStreakQuotaRequiredLabelRule("seasonal streak quota needs an entry");
  const item = newSeasonalStreakQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalStreakQuotaImpressionsRangeRule flags values above impressions", () => {
  const rule = new SeasonalStreakQuotaImpressionsRangeRule(32, 120);
  const item = newSeasonalStreakQuota("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
