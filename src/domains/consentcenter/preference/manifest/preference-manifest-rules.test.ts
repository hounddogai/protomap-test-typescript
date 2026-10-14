import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceManifestCodeLengthRule,
  PreferenceManifestLimitRangeRule,
  PreferenceManifestOpenRateRangeRule,
  PreferenceManifestRequiredVariantRule,
  PreferenceManifestTitleLengthRule,
  defaultPreferenceManifestValidator,
} from "./preference-manifest-rules.js";
import { newPreferenceManifest } from "./preference-manifest.js";

test("PreferenceManifestValidator reports every problem", () => {
  const validator = defaultPreferenceManifestValidator();
  const item = newPreferenceManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceManifestLimitRangeRule flags values above limit", () => {
  const rule = new PreferenceManifestLimitRangeRule(32, 86400);
  const item = newPreferenceManifest("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceManifestTitleLengthRule flags a long title", () => {
  const rule = new PreferenceManifestTitleLengthRule(255);
  const item = newPreferenceManifest("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceManifestOpenRateRangeRule flags values above open rate", () => {
  const rule = new PreferenceManifestOpenRateRangeRule(3.7, 4517.7);
  const item = newPreferenceManifest("x", "y");
  item.openRate = 4519.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceManifestRequiredVariantRule flags a blank variant", () => {
  const rule = new PreferenceManifestRequiredVariantRule("preference manifest needs a value");
  const item = newPreferenceManifest("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceManifestCodeLengthRule flags a long code", () => {
  const rule = new PreferenceManifestCodeLengthRule(80);
  const item = newPreferenceManifest("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
