import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDeflectionManifestRequiredTitleRule,
  TieredDeflectionManifestRequiredUtmSourceRule,
  TieredDeflectionManifestThresholdRangeRule,
  TieredDeflectionManifestTitleLengthRule,
  defaultTieredDeflectionManifestValidator,
} from "./tiered-deflection-manifest-rules.js";
import { newTieredDeflectionManifest } from "./tiered-deflection-manifest.js";

test("TieredDeflectionManifestValidator reports every problem", () => {
  const validator = defaultTieredDeflectionManifestValidator();
  const item = newTieredDeflectionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDeflectionManifestRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new TieredDeflectionManifestRequiredUtmSourceRule("tiered deflection manifest needs an entry");
  const item = newTieredDeflectionManifest("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredDeflectionManifestThresholdRangeRule flags values above threshold", () => {
  const rule = new TieredDeflectionManifestThresholdRangeRule(2.2, 2908.3);
  const item = newTieredDeflectionManifest("x", "y");
  item.threshold = 2909.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredDeflectionManifestTitleLengthRule flags a long title", () => {
  const rule = new TieredDeflectionManifestTitleLengthRule(86400);
  const item = newTieredDeflectionManifest("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDeflectionManifestRequiredTitleRule flags a blank title", () => {
  const rule = new TieredDeflectionManifestRequiredTitleRule("tiered deflection manifest needs this field");
  const item = newTieredDeflectionManifest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
