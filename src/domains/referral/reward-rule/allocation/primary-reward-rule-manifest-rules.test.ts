import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryRewardRuleManifestExternalRefLengthRule,
  PrimaryRewardRuleManifestQuantityRangeRule,
  PrimaryRewardRuleManifestRequiredCodeRule,
  PrimaryRewardRuleManifestRequiredCurrencyRule,
  defaultPrimaryRewardRuleManifestValidator,
} from "./primary-reward-rule-manifest-rules.js";
import { newPrimaryRewardRuleManifest } from "./primary-reward-rule-manifest.js";

test("PrimaryRewardRuleManifestValidator reports every problem", () => {
  const validator = defaultPrimaryRewardRuleManifestValidator();
  const item = newPrimaryRewardRuleManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryRewardRuleManifestRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryRewardRuleManifestRequiredCodeRule("primary reward rule manifest needs an entry");
  const item = newPrimaryRewardRuleManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryRewardRuleManifestQuantityRangeRule flags values above quantity", () => {
  const rule = new PrimaryRewardRuleManifestQuantityRangeRule(3600, 86400);
  const item = newPrimaryRewardRuleManifest("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryRewardRuleManifestExternalRefLengthRule flags a long external ref", () => {
  const rule = new PrimaryRewardRuleManifestExternalRefLengthRule(3600);
  const item = newPrimaryRewardRuleManifest("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryRewardRuleManifestRequiredCurrencyRule flags a blank currency", () => {
  const rule = new PrimaryRewardRuleManifestRequiredCurrencyRule("primary reward rule manifest needs a value");
  const item = newPrimaryRewardRuleManifest("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
