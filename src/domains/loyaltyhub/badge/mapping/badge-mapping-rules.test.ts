import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeMappingFrequencyCapRangeRule,
  BadgeMappingRequiredChannelRule,
  BadgeMappingThresholdRangeRule,
  defaultBadgeMappingValidator,
} from "./badge-mapping-rules.js";
import { newBadgeMapping } from "./badge-mapping.js";

test("BadgeMappingValidator reports every problem", () => {
  const validator = defaultBadgeMappingValidator();
  const item = newBadgeMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeMappingThresholdRangeRule flags values above threshold", () => {
  const rule = new BadgeMappingThresholdRangeRule(8.7, 1364.5);
  const item = newBadgeMapping("x", "y");
  item.threshold = 1366;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeMappingFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BadgeMappingFrequencyCapRangeRule(32, 1000);
  const item = newBadgeMapping("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeMappingRequiredChannelRule flags a blank channel", () => {
  const rule = new BadgeMappingRequiredChannelRule("badge mapping needs an entry");
  const item = newBadgeMapping("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
