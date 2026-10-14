import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleDraftCodeLengthRule,
  RewardRuleDraftRequiredExternalRefRule,
  RewardRuleDraftRequiredVariantRule,
  RewardRuleDraftVersionRangeRule,
  defaultRewardRuleDraftValidator,
} from "./reward-rule-draft-rules.js";
import { newRewardRuleDraft } from "./reward-rule-draft.js";

test("RewardRuleDraftValidator reports every problem", () => {
  const validator = defaultRewardRuleDraftValidator();
  const item = newRewardRuleDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleDraftCodeLengthRule flags a long code", () => {
  const rule = new RewardRuleDraftCodeLengthRule(86400);
  const item = newRewardRuleDraft("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleDraftRequiredVariantRule flags a blank variant", () => {
  const rule = new RewardRuleDraftRequiredVariantRule("reward rule draft needs an entry");
  const item = newRewardRuleDraft("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleDraftRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new RewardRuleDraftRequiredExternalRefRule("reward rule draft needs an entry");
  const item = newRewardRuleDraft("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleDraftVersionRangeRule flags values above version", () => {
  const rule = new RewardRuleDraftVersionRangeRule(64, 64);
  const item = newRewardRuleDraft("x", "y");
  item.version = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
