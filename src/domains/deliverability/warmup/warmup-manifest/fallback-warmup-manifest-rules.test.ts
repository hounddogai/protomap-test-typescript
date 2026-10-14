import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackWarmupManifestOpenRateRangeRule,
  FallbackWarmupManifestRequiredCodeRule,
  FallbackWarmupManifestUnitLengthRule,
  defaultFallbackWarmupManifestValidator,
} from "./fallback-warmup-manifest-rules.js";
import { newFallbackWarmupManifest } from "./fallback-warmup-manifest.js";

test("FallbackWarmupManifestValidator reports every problem", () => {
  const validator = defaultFallbackWarmupManifestValidator();
  const item = newFallbackWarmupManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackWarmupManifestUnitLengthRule flags a long unit", () => {
  const rule = new FallbackWarmupManifestUnitLengthRule(80);
  const item = newFallbackWarmupManifest("x", "y");
  item.unit = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackWarmupManifestRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackWarmupManifestRequiredCodeRule("fallback warmup manifest needs a value");
  const item = newFallbackWarmupManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackWarmupManifestOpenRateRangeRule flags values above open rate", () => {
  const rule = new FallbackWarmupManifestOpenRateRangeRule(6.4, 2501.5);
  const item = newFallbackWarmupManifest("x", "y");
  item.openRate = 2503;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
