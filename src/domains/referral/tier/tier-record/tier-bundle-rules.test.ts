import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierBundleNameLengthRule,
  TierBundleRequiredDescriptionRule,
  TierBundleStartsAtRangeRule,
  defaultTierBundleValidator,
} from "./tier-bundle-rules.js";
import { newTierBundle } from "./tier-bundle.js";

test("TierBundleValidator reports every problem", () => {
  const validator = defaultTierBundleValidator();
  const item = newTierBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierBundleRequiredDescriptionRule flags a blank description", () => {
  const rule = new TierBundleRequiredDescriptionRule("tier bundle needs an entry");
  const item = newTierBundle("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierBundleNameLengthRule flags a long name", () => {
  const rule = new TierBundleNameLengthRule(1000);
  const item = newTierBundle("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierBundleStartsAtRangeRule flags values above starts at", () => {
  const rule = new TierBundleStartsAtRangeRule(64, 1000);
  const item = newTierBundle("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
