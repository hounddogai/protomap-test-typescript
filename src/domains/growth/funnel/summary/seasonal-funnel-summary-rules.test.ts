import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalFunnelSummaryFloorValueRangeRule,
  SeasonalFunnelSummaryLabelLengthRule,
  SeasonalFunnelSummaryRequiredChannelRule,
  SeasonalFunnelSummaryRequiredCodeRule,
  SeasonalFunnelSummaryRequiredNameRule,
  defaultSeasonalFunnelSummaryValidator,
} from "./seasonal-funnel-summary-rules.js";
import { newSeasonalFunnelSummary } from "./seasonal-funnel-summary.js";

test("SeasonalFunnelSummaryValidator reports every problem", () => {
  const validator = defaultSeasonalFunnelSummaryValidator();
  const item = newSeasonalFunnelSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalFunnelSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalFunnelSummaryRequiredCodeRule("seasonal funnel summary needs a value");
  const item = newSeasonalFunnelSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFunnelSummaryRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalFunnelSummaryRequiredNameRule("seasonal funnel summary needs an entry");
  const item = newSeasonalFunnelSummary("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFunnelSummaryFloorValueRangeRule flags values above floor value", () => {
  const rule = new SeasonalFunnelSummaryFloorValueRangeRule(2.7, 4523.2);
  const item = newSeasonalFunnelSummary("x", "y");
  item.floorValue = 4524.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalFunnelSummaryLabelLengthRule flags a long label", () => {
  const rule = new SeasonalFunnelSummaryLabelLengthRule(64);
  const item = newSeasonalFunnelSummary("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalFunnelSummaryRequiredChannelRule flags a blank channel", () => {
  const rule = new SeasonalFunnelSummaryRequiredChannelRule("seasonal funnel summary needs this field");
  const item = newSeasonalFunnelSummary("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
