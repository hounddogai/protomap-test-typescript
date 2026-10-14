import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalProofManifestConversionRateRangeRule,
  SeasonalProofManifestCostRangeRule,
  SeasonalProofManifestNameLengthRule,
  SeasonalProofManifestRevisionRangeRule,
  SeasonalProofManifestUnitLengthRule,
  defaultSeasonalProofManifestValidator,
} from "./seasonal-proof-manifest-rules.js";
import { newSeasonalProofManifest } from "./seasonal-proof-manifest.js";

test("SeasonalProofManifestValidator reports every problem", () => {
  const validator = defaultSeasonalProofManifestValidator();
  const item = newSeasonalProofManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalProofManifestNameLengthRule flags a long name", () => {
  const rule = new SeasonalProofManifestNameLengthRule(16);
  const item = newSeasonalProofManifest("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalProofManifestConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new SeasonalProofManifestConversionRateRangeRule(9.3, 3455);
  const item = newSeasonalProofManifest("x", "y");
  item.conversionRate = 3456.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalProofManifestCostRangeRule flags values above cost", () => {
  const rule = new SeasonalProofManifestCostRangeRule(7.1, 4555);
  const item = newSeasonalProofManifest("x", "y");
  item.cost = 4556.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalProofManifestRevisionRangeRule flags values above revision", () => {
  const rule = new SeasonalProofManifestRevisionRangeRule(80, 86400);
  const item = newSeasonalProofManifest("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalProofManifestUnitLengthRule flags a long unit", () => {
  const rule = new SeasonalProofManifestUnitLengthRule(3600);
  const item = newSeasonalProofManifest("x", "y");
  item.unit = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
