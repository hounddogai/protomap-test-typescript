import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPayoutManifestRequiredNameRule,
  PrimaryPayoutManifestScoreRangeRule,
  PrimaryPayoutManifestVariantLengthRule,
  defaultPrimaryPayoutManifestValidator,
} from "./primary-payout-manifest-rules.js";
import { newPrimaryPayoutManifest } from "./primary-payout-manifest.js";

test("PrimaryPayoutManifestValidator reports every problem", () => {
  const validator = defaultPrimaryPayoutManifestValidator();
  const item = newPrimaryPayoutManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPayoutManifestVariantLengthRule flags a long variant", () => {
  const rule = new PrimaryPayoutManifestVariantLengthRule(3600);
  const item = newPrimaryPayoutManifest("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPayoutManifestScoreRangeRule flags values above score", () => {
  const rule = new PrimaryPayoutManifestScoreRangeRule(0.8, 4531);
  const item = newPrimaryPayoutManifest("x", "y");
  item.score = 4532.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPayoutManifestRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryPayoutManifestRequiredNameRule("primary payout manifest needs this field");
  const item = newPrimaryPayoutManifest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
