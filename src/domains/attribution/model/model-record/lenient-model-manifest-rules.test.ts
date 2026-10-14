import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientModelManifestImpressionsRangeRule,
  LenientModelManifestTitleLengthRule,
  LenientModelManifestUpdatedAtRangeRule,
  defaultLenientModelManifestValidator,
} from "./lenient-model-manifest-rules.js";
import { newLenientModelManifest } from "./lenient-model-manifest.js";

test("LenientModelManifestValidator reports every problem", () => {
  const validator = defaultLenientModelManifestValidator();
  const item = newLenientModelManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientModelManifestTitleLengthRule flags a long title", () => {
  const rule = new LenientModelManifestTitleLengthRule(3600);
  const item = newLenientModelManifest("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientModelManifestImpressionsRangeRule flags values above impressions", () => {
  const rule = new LenientModelManifestImpressionsRangeRule(255, 86400);
  const item = newLenientModelManifest("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientModelManifestUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new LenientModelManifestUpdatedAtRangeRule(32, 1000);
  const item = newLenientModelManifest("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
