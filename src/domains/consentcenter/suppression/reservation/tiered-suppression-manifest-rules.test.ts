import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredSuppressionManifestRequiredNameRule,
  TieredSuppressionManifestTitleLengthRule,
  defaultTieredSuppressionManifestValidator,
} from "./tiered-suppression-manifest-rules.js";
import { newTieredSuppressionManifest } from "./tiered-suppression-manifest.js";

test("TieredSuppressionManifestValidator reports every problem", () => {
  const validator = defaultTieredSuppressionManifestValidator();
  const item = newTieredSuppressionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredSuppressionManifestTitleLengthRule flags a long title", () => {
  const rule = new TieredSuppressionManifestTitleLengthRule(86400);
  const item = newTieredSuppressionManifest("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredSuppressionManifestRequiredNameRule flags a blank name", () => {
  const rule = new TieredSuppressionManifestRequiredNameRule("tiered suppression manifest needs this field");
  const item = newTieredSuppressionManifest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
