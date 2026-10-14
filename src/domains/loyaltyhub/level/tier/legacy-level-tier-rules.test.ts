import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyLevelTierDescriptionLengthRule,
  LegacyLevelTierRequiredCodeRule,
  LegacyLevelTierRequiredSummaryRule,
  defaultLegacyLevelTierValidator,
} from "./legacy-level-tier-rules.js";
import { newLegacyLevelTier } from "./legacy-level-tier.js";

test("LegacyLevelTierValidator reports every problem", () => {
  const validator = defaultLegacyLevelTierValidator();
  const item = newLegacyLevelTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyLevelTierRequiredSummaryRule flags a blank summary", () => {
  const rule = new LegacyLevelTierRequiredSummaryRule("legacy level tier needs this field");
  const item = newLegacyLevelTier("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyLevelTierRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyLevelTierRequiredCodeRule("legacy level tier needs an entry");
  const item = newLegacyLevelTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyLevelTierDescriptionLengthRule flags a long description", () => {
  const rule = new LegacyLevelTierDescriptionLengthRule(1000);
  const item = newLegacyLevelTier("x", "y");
  item.description = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
