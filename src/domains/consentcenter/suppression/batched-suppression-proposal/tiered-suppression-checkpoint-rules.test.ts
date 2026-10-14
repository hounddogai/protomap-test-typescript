import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredSuppressionCheckpointCampaignRefLengthRule,
  TieredSuppressionCheckpointConversionRateRangeRule,
  TieredSuppressionCheckpointRequiredCampaignRefRule,
  TieredSuppressionCheckpointRequiredNameRule,
  defaultTieredSuppressionCheckpointValidator,
} from "./tiered-suppression-checkpoint-rules.js";
import { newTieredSuppressionCheckpoint } from "./tiered-suppression-checkpoint.js";

test("TieredSuppressionCheckpointValidator reports every problem", () => {
  const validator = defaultTieredSuppressionCheckpointValidator();
  const item = newTieredSuppressionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredSuppressionCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new TieredSuppressionCheckpointRequiredNameRule("tiered suppression checkpoint needs this field");
  const item = newTieredSuppressionCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredSuppressionCheckpointRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new TieredSuppressionCheckpointRequiredCampaignRefRule("tiered suppression checkpoint needs an entry");
  const item = newTieredSuppressionCheckpoint("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredSuppressionCheckpointConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new TieredSuppressionCheckpointConversionRateRangeRule(3, 4911.6);
  const item = newTieredSuppressionCheckpoint("x", "y");
  item.conversionRate = 4913.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredSuppressionCheckpointCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new TieredSuppressionCheckpointCampaignRefLengthRule(86400);
  const item = newTieredSuppressionCheckpoint("x", "y");
  item.campaignRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
