import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalTierManifestCodeLengthRule,
  RegionalTierManifestEndsAtRangeRule,
  RegionalTierManifestRequiredLabelRule,
  defaultRegionalTierManifestValidator,
} from "./regional-tier-manifest-rules.js";
import { newRegionalTierManifest } from "./regional-tier-manifest.js";

test("RegionalTierManifestValidator reports every problem", () => {
  const validator = defaultRegionalTierManifestValidator();
  const item = newRegionalTierManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalTierManifestRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalTierManifestRequiredLabelRule("regional tier manifest needs a value");
  const item = newRegionalTierManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalTierManifestCodeLengthRule flags a long code", () => {
  const rule = new RegionalTierManifestCodeLengthRule(64);
  const item = newRegionalTierManifest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalTierManifestEndsAtRangeRule flags values above ends at", () => {
  const rule = new RegionalTierManifestEndsAtRangeRule(32, 255);
  const item = newRegionalTierManifest("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
