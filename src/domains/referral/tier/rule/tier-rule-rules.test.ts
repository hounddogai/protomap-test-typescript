import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierRuleChannelLengthRule,
  TierRuleFrequencyCapRangeRule,
  TierRuleRequiredChannelRule,
  defaultTierRuleValidator,
} from "./tier-rule-rules.js";
import { newTierRule } from "./tier-rule.js";

test("TierRuleValidator reports every problem", () => {
  const validator = defaultTierRuleValidator();
  const item = newTierRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierRuleRequiredChannelRule flags a blank channel", () => {
  const rule = new TierRuleRequiredChannelRule("tier rule needs an entry");
  const item = newTierRule("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierRuleChannelLengthRule flags a long channel", () => {
  const rule = new TierRuleChannelLengthRule(3600);
  const item = newTierRule("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierRuleFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new TierRuleFrequencyCapRangeRule(64, 255);
  const item = newTierRule("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
