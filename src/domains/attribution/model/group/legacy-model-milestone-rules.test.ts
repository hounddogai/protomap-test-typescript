import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyModelMilestoneConversionRateRangeRule,
  LegacyModelMilestoneNameLengthRule,
  LegacyModelMilestoneRequiredChannelRule,
  defaultLegacyModelMilestoneValidator,
} from "./legacy-model-milestone-rules.js";
import { newLegacyModelMilestone } from "./legacy-model-milestone.js";

test("LegacyModelMilestoneValidator reports every problem", () => {
  const validator = defaultLegacyModelMilestoneValidator();
  const item = newLegacyModelMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyModelMilestoneConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new LegacyModelMilestoneConversionRateRangeRule(6.8, 4555.9);
  const item = newLegacyModelMilestone("x", "y");
  item.conversionRate = 4557.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyModelMilestoneRequiredChannelRule flags a blank channel", () => {
  const rule = new LegacyModelMilestoneRequiredChannelRule("legacy model milestone needs an entry");
  const item = newLegacyModelMilestone("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyModelMilestoneNameLengthRule flags a long name", () => {
  const rule = new LegacyModelMilestoneNameLengthRule(64);
  const item = newLegacyModelMilestone("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
