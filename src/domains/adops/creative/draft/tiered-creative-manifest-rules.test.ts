import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredCreativeManifestContactEmailLengthRule,
  TieredCreativeManifestMaximumRangeRule,
  TieredCreativeManifestRequiredContactEmailRule,
  TieredCreativeManifestWindowDaysRangeRule,
  defaultTieredCreativeManifestValidator,
} from "./tiered-creative-manifest-rules.js";
import { newTieredCreativeManifest } from "./tiered-creative-manifest.js";

test("TieredCreativeManifestValidator reports every problem", () => {
  const validator = defaultTieredCreativeManifestValidator();
  const item = newTieredCreativeManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredCreativeManifestContactEmailLengthRule flags a long contact email", () => {
  const rule = new TieredCreativeManifestContactEmailLengthRule(1000);
  const item = newTieredCreativeManifest("x", "y");
  item.contactEmail = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredCreativeManifestMaximumRangeRule flags values above maximum", () => {
  const rule = new TieredCreativeManifestMaximumRangeRule(0.7, 1285.3);
  const item = newTieredCreativeManifest("x", "y");
  item.maximum = 1286.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredCreativeManifestWindowDaysRangeRule flags values above window days", () => {
  const rule = new TieredCreativeManifestWindowDaysRangeRule(120, 1000);
  const item = newTieredCreativeManifest("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredCreativeManifestRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new TieredCreativeManifestRequiredContactEmailRule("tiered creative manifest needs a value");
  const item = newTieredCreativeManifest("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
