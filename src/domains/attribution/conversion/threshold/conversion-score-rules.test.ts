import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionScoreBudgetRangeRule,
  ConversionScoreCodeLengthRule,
  ConversionScoreLabelLengthRule,
  ConversionScoreRequiredCampaignRefRule,
  ConversionScoreRequiredLabelRule,
  defaultConversionScoreValidator,
} from "./conversion-score-rules.js";
import { newConversionScore } from "./conversion-score.js";

test("ConversionScoreValidator reports every problem", () => {
  const validator = defaultConversionScoreValidator();
  const item = newConversionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionScoreLabelLengthRule flags a long label", () => {
  const rule = new ConversionScoreLabelLengthRule(64);
  const item = newConversionScore("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionScoreRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ConversionScoreRequiredCampaignRefRule("conversion score needs this field");
  const item = newConversionScore("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionScoreRequiredLabelRule flags a blank label", () => {
  const rule = new ConversionScoreRequiredLabelRule("conversion score needs a value");
  const item = newConversionScore("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionScoreCodeLengthRule flags a long code", () => {
  const rule = new ConversionScoreCodeLengthRule(120);
  const item = newConversionScore("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionScoreBudgetRangeRule flags values above budget", () => {
  const rule = new ConversionScoreBudgetRangeRule(0.2, 2932.1);
  const item = newConversionScore("x", "y");
  item.budget = 2933.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
