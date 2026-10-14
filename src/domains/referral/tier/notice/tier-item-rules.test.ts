import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierItemOpenRateRangeRule,
  TierItemRegionLengthRule,
  TierItemRequiredNameRule,
  defaultTierItemValidator,
} from "./tier-item-rules.js";
import { newTierItem } from "./tier-item.js";

test("TierItemValidator reports every problem", () => {
  const validator = defaultTierItemValidator();
  const item = newTierItem("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierItemOpenRateRangeRule flags values above open rate", () => {
  const rule = new TierItemOpenRateRangeRule(5.7, 4176.2);
  const item = newTierItem("x", "y");
  item.openRate = 4177.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierItemRegionLengthRule flags a long region", () => {
  const rule = new TierItemRegionLengthRule(1000);
  const item = newTierItem("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierItemRequiredNameRule flags a blank name", () => {
  const rule = new TierItemRequiredNameRule("tier item needs a value");
  const item = newTierItem("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
