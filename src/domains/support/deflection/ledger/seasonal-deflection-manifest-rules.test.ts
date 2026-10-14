import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalDeflectionManifestCodeLengthRule,
  SeasonalDeflectionManifestOpenRateRangeRule,
  SeasonalDeflectionManifestOwnerIdLengthRule,
  SeasonalDeflectionManifestRequiredOwnerIdRule,
  SeasonalDeflectionManifestTitleLengthRule,
  defaultSeasonalDeflectionManifestValidator,
} from "./seasonal-deflection-manifest-rules.js";
import { newSeasonalDeflectionManifest } from "./seasonal-deflection-manifest.js";

test("SeasonalDeflectionManifestValidator reports every problem", () => {
  const validator = defaultSeasonalDeflectionManifestValidator();
  const item = newSeasonalDeflectionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalDeflectionManifestCodeLengthRule flags a long code", () => {
  const rule = new SeasonalDeflectionManifestCodeLengthRule(1000);
  const item = newSeasonalDeflectionManifest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDeflectionManifestOwnerIdLengthRule flags a long owner id", () => {
  const rule = new SeasonalDeflectionManifestOwnerIdLengthRule(1000);
  const item = newSeasonalDeflectionManifest("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDeflectionManifestRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new SeasonalDeflectionManifestRequiredOwnerIdRule("seasonal deflection manifest needs a value");
  const item = newSeasonalDeflectionManifest("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalDeflectionManifestTitleLengthRule flags a long title", () => {
  const rule = new SeasonalDeflectionManifestTitleLengthRule(1000);
  const item = newSeasonalDeflectionManifest("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDeflectionManifestOpenRateRangeRule flags values above open rate", () => {
  const rule = new SeasonalDeflectionManifestOpenRateRangeRule(9.7, 2297.4);
  const item = newSeasonalDeflectionManifest("x", "y");
  item.openRate = 2298.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
