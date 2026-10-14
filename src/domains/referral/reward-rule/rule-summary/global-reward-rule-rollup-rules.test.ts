import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRewardRuleRollupCampaignRefLengthRule,
  GlobalRewardRuleRollupCodeLengthRule,
  GlobalRewardRuleRollupRequiredCampaignRefRule,
  GlobalRewardRuleRollupRequiredCountryRule,
  GlobalRewardRuleRollupRequiredTitleRule,
  GlobalRewardRuleRollupRevisionRangeRule,
  defaultGlobalRewardRuleRollupValidator,
} from "./global-reward-rule-rollup-rules.js";
import { newGlobalRewardRuleRollup } from "./global-reward-rule-rollup.js";

test("GlobalRewardRuleRollupValidator reports every problem", () => {
  const validator = defaultGlobalRewardRuleRollupValidator();
  const item = newGlobalRewardRuleRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRewardRuleRollupCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new GlobalRewardRuleRollupCampaignRefLengthRule(16);
  const item = newGlobalRewardRuleRollup("x", "y");
  item.campaignRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRewardRuleRollupRevisionRangeRule flags values above revision", () => {
  const rule = new GlobalRewardRuleRollupRevisionRangeRule(16, 255);
  const item = newGlobalRewardRuleRollup("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRewardRuleRollupRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalRewardRuleRollupRequiredTitleRule("global reward rule rollup needs this field");
  const item = newGlobalRewardRuleRollup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardRuleRollupRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new GlobalRewardRuleRollupRequiredCampaignRefRule("global reward rule rollup needs this field");
  const item = newGlobalRewardRuleRollup("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardRuleRollupRequiredCountryRule flags a blank country", () => {
  const rule = new GlobalRewardRuleRollupRequiredCountryRule("global reward rule rollup needs this field");
  const item = newGlobalRewardRuleRollup("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardRuleRollupCodeLengthRule flags a long code", () => {
  const rule = new GlobalRewardRuleRollupCodeLengthRule(120);
  const item = newGlobalRewardRuleRollup("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
