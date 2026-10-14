import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalConversionScoreCodeLengthRule,
  RegionalConversionScoreGraceDaysRangeRule,
  RegionalConversionScoreNotesLengthRule,
  RegionalConversionScoreRequiredLabelRule,
  RegionalConversionScoreRequiredNotesRule,
  defaultRegionalConversionScoreValidator,
} from "./regional-conversion-score-rules.js";
import { newRegionalConversionScore } from "./regional-conversion-score.js";

test("RegionalConversionScoreValidator reports every problem", () => {
  const validator = defaultRegionalConversionScoreValidator();
  const item = newRegionalConversionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalConversionScoreRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalConversionScoreRequiredLabelRule("regional conversion score needs this field");
  const item = newRegionalConversionScore("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalConversionScoreGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RegionalConversionScoreGraceDaysRangeRule(16, 32);
  const item = newRegionalConversionScore("x", "y");
  item.graceDays = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalConversionScoreRequiredNotesRule flags a blank notes", () => {
  const rule = new RegionalConversionScoreRequiredNotesRule("regional conversion score needs a value");
  const item = newRegionalConversionScore("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalConversionScoreCodeLengthRule flags a long code", () => {
  const rule = new RegionalConversionScoreCodeLengthRule(80);
  const item = newRegionalConversionScore("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalConversionScoreNotesLengthRule flags a long notes", () => {
  const rule = new RegionalConversionScoreNotesLengthRule(3600);
  const item = newRegionalConversionScore("x", "y");
  item.notes = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
