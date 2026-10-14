import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierThresholdChannelLengthRule,
  TierThresholdRequiredChannelRule,
  defaultTierThresholdValidator,
} from "./tier-threshold-rules.js";
import { newTierThreshold } from "./tier-threshold.js";

test("TierThresholdValidator reports every problem", () => {
  const validator = defaultTierThresholdValidator();
  const item = newTierThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierThresholdRequiredChannelRule flags a blank channel", () => {
  const rule = new TierThresholdRequiredChannelRule("tier threshold needs an entry");
  const item = newTierThreshold("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierThresholdChannelLengthRule flags a long channel", () => {
  const rule = new TierThresholdChannelLengthRule(32);
  const item = newTierThreshold("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
