import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalCsatTemplateRequiredCodeRule,
  SeasonalCsatTemplateRequiredJourneyIdRule,
  SeasonalCsatTemplateWeightRangeRule,
  defaultSeasonalCsatTemplateValidator,
} from "./seasonal-csat-template-rules.js";
import { newSeasonalCsatTemplate } from "./seasonal-csat-template.js";

test("SeasonalCsatTemplateValidator reports every problem", () => {
  const validator = defaultSeasonalCsatTemplateValidator();
  const item = newSeasonalCsatTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalCsatTemplateWeightRangeRule flags values above weight", () => {
  const rule = new SeasonalCsatTemplateWeightRangeRule(5.5, 3502.7);
  const item = newSeasonalCsatTemplate("x", "y");
  item.weight = 3504.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalCsatTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalCsatTemplateRequiredCodeRule("seasonal csat template needs this field");
  const item = newSeasonalCsatTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalCsatTemplateRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new SeasonalCsatTemplateRequiredJourneyIdRule("seasonal csat template needs a value");
  const item = newSeasonalCsatTemplate("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
