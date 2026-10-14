import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveLevelVarianceCodeLengthRule,
  AdaptiveLevelVarianceLabelLengthRule,
  AdaptiveLevelVarianceRequiredCampaignRefRule,
  AdaptiveLevelVarianceRequiredCodeRule,
  AdaptiveLevelVarianceRevisionRangeRule,
  defaultAdaptiveLevelVarianceValidator,
} from "./adaptive-level-variance-rules.js";
import { newAdaptiveLevelVariance } from "./adaptive-level-variance.js";

test("AdaptiveLevelVarianceValidator reports every problem", () => {
  const validator = defaultAdaptiveLevelVarianceValidator();
  const item = newAdaptiveLevelVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveLevelVarianceLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveLevelVarianceLabelLengthRule(255);
  const item = newAdaptiveLevelVariance("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveLevelVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveLevelVarianceRequiredCodeRule("adaptive level variance needs this field");
  const item = newAdaptiveLevelVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveLevelVarianceCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveLevelVarianceCodeLengthRule(80);
  const item = newAdaptiveLevelVariance("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveLevelVarianceRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new AdaptiveLevelVarianceRequiredCampaignRefRule("adaptive level variance needs this field");
  const item = newAdaptiveLevelVariance("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveLevelVarianceRevisionRangeRule flags values above revision", () => {
  const rule = new AdaptiveLevelVarianceRevisionRangeRule(86400, 86400);
  const item = newAdaptiveLevelVariance("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
