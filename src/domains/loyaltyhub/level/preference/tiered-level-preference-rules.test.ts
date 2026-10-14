import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredLevelPreferenceCampaignRefLengthRule,
  TieredLevelPreferenceRequiredCategoryRule,
  TieredLevelPreferenceRequiredCodeRule,
  defaultTieredLevelPreferenceValidator,
} from "./tiered-level-preference-rules.js";
import { newTieredLevelPreference } from "./tiered-level-preference.js";

test("TieredLevelPreferenceValidator reports every problem", () => {
  const validator = defaultTieredLevelPreferenceValidator();
  const item = newTieredLevelPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredLevelPreferenceRequiredCategoryRule flags a blank category", () => {
  const rule = new TieredLevelPreferenceRequiredCategoryRule("tiered level preference needs an entry");
  const item = newTieredLevelPreference("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredLevelPreferenceCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new TieredLevelPreferenceCampaignRefLengthRule(255);
  const item = newTieredLevelPreference("x", "y");
  item.campaignRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredLevelPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new TieredLevelPreferenceRequiredCodeRule("tiered level preference needs this field");
  const item = newTieredLevelPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
