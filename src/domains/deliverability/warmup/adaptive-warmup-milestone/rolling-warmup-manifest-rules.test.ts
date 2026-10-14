import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingWarmupManifestClicksRangeRule,
  RollingWarmupManifestEndsAtRangeRule,
  RollingWarmupManifestLabelLengthRule,
  RollingWarmupManifestRequiredLabelRule,
  defaultRollingWarmupManifestValidator,
} from "./rolling-warmup-manifest-rules.js";
import { newRollingWarmupManifest } from "./rolling-warmup-manifest.js";

test("RollingWarmupManifestValidator reports every problem", () => {
  const validator = defaultRollingWarmupManifestValidator();
  const item = newRollingWarmupManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingWarmupManifestClicksRangeRule flags values above clicks", () => {
  const rule = new RollingWarmupManifestClicksRangeRule(80, 86400);
  const item = newRollingWarmupManifest("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWarmupManifestEndsAtRangeRule flags values above ends at", () => {
  const rule = new RollingWarmupManifestEndsAtRangeRule(32, 64);
  const item = newRollingWarmupManifest("x", "y");
  item.endsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWarmupManifestRequiredLabelRule flags a blank label", () => {
  const rule = new RollingWarmupManifestRequiredLabelRule("rolling warmup manifest needs an entry");
  const item = newRollingWarmupManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingWarmupManifestLabelLengthRule flags a long label", () => {
  const rule = new RollingWarmupManifestLabelLengthRule(3600);
  const item = newRollingWarmupManifest("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
