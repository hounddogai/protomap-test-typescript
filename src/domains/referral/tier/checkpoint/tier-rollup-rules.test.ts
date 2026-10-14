import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierRollupLabelLengthRule,
  TierRollupNameLengthRule,
  TierRollupOpenRateRangeRule,
  TierRollupRequiredLabelRule,
  TierRollupRequiredNameRule,
  defaultTierRollupValidator,
} from "./tier-rollup-rules.js";
import { newTierRollup } from "./tier-rollup.js";

test("TierRollupValidator reports every problem", () => {
  const validator = defaultTierRollupValidator();
  const item = newTierRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierRollupRequiredLabelRule flags a blank label", () => {
  const rule = new TierRollupRequiredLabelRule("tier rollup needs a value");
  const item = newTierRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierRollupOpenRateRangeRule flags values above open rate", () => {
  const rule = new TierRollupOpenRateRangeRule(4, 231);
  const item = newTierRollup("x", "y");
  item.openRate = 232.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierRollupRequiredNameRule flags a blank name", () => {
  const rule = new TierRollupRequiredNameRule("tier rollup needs an entry");
  const item = newTierRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierRollupNameLengthRule flags a long name", () => {
  const rule = new TierRollupNameLengthRule(16);
  const item = newTierRollup("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierRollupLabelLengthRule flags a long label", () => {
  const rule = new TierRollupLabelLengthRule(86400);
  const item = newTierRollup("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
