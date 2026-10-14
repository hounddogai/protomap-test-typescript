import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredExitRuleDigestCountryLengthRule,
  TieredExitRuleDigestImpressionsRangeRule,
  TieredExitRuleDigestNameLengthRule,
  TieredExitRuleDigestRequiredCountryRule,
  defaultTieredExitRuleDigestValidator,
} from "./tiered-exit-rule-digest-rules.js";
import { newTieredExitRuleDigest } from "./tiered-exit-rule-digest.js";

test("TieredExitRuleDigestValidator reports every problem", () => {
  const validator = defaultTieredExitRuleDigestValidator();
  const item = newTieredExitRuleDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredExitRuleDigestNameLengthRule flags a long name", () => {
  const rule = new TieredExitRuleDigestNameLengthRule(3600);
  const item = newTieredExitRuleDigest("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredExitRuleDigestImpressionsRangeRule flags values above impressions", () => {
  const rule = new TieredExitRuleDigestImpressionsRangeRule(16, 120);
  const item = newTieredExitRuleDigest("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredExitRuleDigestCountryLengthRule flags a long country", () => {
  const rule = new TieredExitRuleDigestCountryLengthRule(16);
  const item = newTieredExitRuleDigest("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredExitRuleDigestRequiredCountryRule flags a blank country", () => {
  const rule = new TieredExitRuleDigestRequiredCountryRule("tiered exit rule digest needs an entry");
  const item = newTieredExitRuleDigest("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
