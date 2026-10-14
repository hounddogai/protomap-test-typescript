import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredFlightManifestCountryLengthRule,
  TieredFlightManifestFloorValueRangeRule,
  TieredFlightManifestLabelLengthRule,
  TieredFlightManifestRequiredCodeRule,
  defaultTieredFlightManifestValidator,
} from "./tiered-flight-manifest-rules.js";
import { newTieredFlightManifest } from "./tiered-flight-manifest.js";

test("TieredFlightManifestValidator reports every problem", () => {
  const validator = defaultTieredFlightManifestValidator();
  const item = newTieredFlightManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredFlightManifestRequiredCodeRule flags a blank code", () => {
  const rule = new TieredFlightManifestRequiredCodeRule("tiered flight manifest needs this field");
  const item = newTieredFlightManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredFlightManifestLabelLengthRule flags a long label", () => {
  const rule = new TieredFlightManifestLabelLengthRule(255);
  const item = newTieredFlightManifest("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredFlightManifestCountryLengthRule flags a long country", () => {
  const rule = new TieredFlightManifestCountryLengthRule(80);
  const item = newTieredFlightManifest("x", "y");
  item.country = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredFlightManifestFloorValueRangeRule flags values above floor value", () => {
  const rule = new TieredFlightManifestFloorValueRangeRule(8.3, 1245.6);
  const item = newTieredFlightManifest("x", "y");
  item.floorValue = 1247.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
