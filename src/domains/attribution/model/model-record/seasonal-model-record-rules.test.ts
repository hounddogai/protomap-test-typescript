import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalModelRecordConversionRateRangeRule,
  SeasonalModelRecordCountryLengthRule,
  SeasonalModelRecordLocaleLengthRule,
  defaultSeasonalModelRecordValidator,
} from "./seasonal-model-record-rules.js";
import { newSeasonalModelRecord } from "./seasonal-model-record.js";

test("SeasonalModelRecordValidator reports every problem", () => {
  const validator = defaultSeasonalModelRecordValidator();
  const item = newSeasonalModelRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalModelRecordConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new SeasonalModelRecordConversionRateRangeRule(7.2, 3618.4);
  const item = newSeasonalModelRecord("x", "y");
  item.conversionRate = 3619.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalModelRecordCountryLengthRule flags a long country", () => {
  const rule = new SeasonalModelRecordCountryLengthRule(3600);
  const item = newSeasonalModelRecord("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalModelRecordLocaleLengthRule flags a long locale", () => {
  const rule = new SeasonalModelRecordLocaleLengthRule(80);
  const item = newSeasonalModelRecord("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
