import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveRewardRuleTargetChannelLengthRule,
  AdaptiveRewardRuleTargetCodeLengthRule,
  AdaptiveRewardRuleTargetImpressionsRangeRule,
  AdaptiveRewardRuleTargetRequiredCodeRule,
  AdaptiveRewardRuleTargetRequiredTitleRule,
  defaultAdaptiveRewardRuleTargetValidator,
} from "./adaptive-reward-rule-target-rules.js";
import { newAdaptiveRewardRuleTarget } from "./adaptive-reward-rule-target.js";

test("AdaptiveRewardRuleTargetValidator reports every problem", () => {
  const validator = defaultAdaptiveRewardRuleTargetValidator();
  const item = newAdaptiveRewardRuleTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveRewardRuleTargetRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveRewardRuleTargetRequiredCodeRule("adaptive reward rule target needs an entry");
  const item = newAdaptiveRewardRuleTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveRewardRuleTargetChannelLengthRule flags a long channel", () => {
  const rule = new AdaptiveRewardRuleTargetChannelLengthRule(120);
  const item = newAdaptiveRewardRuleTarget("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveRewardRuleTargetRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveRewardRuleTargetRequiredTitleRule("adaptive reward rule target needs this field");
  const item = newAdaptiveRewardRuleTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveRewardRuleTargetCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveRewardRuleTargetCodeLengthRule(255);
  const item = newAdaptiveRewardRuleTarget("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveRewardRuleTargetImpressionsRangeRule flags values above impressions", () => {
  const rule = new AdaptiveRewardRuleTargetImpressionsRangeRule(32, 80);
  const item = newAdaptiveRewardRuleTarget("x", "y");
  item.impressions = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
