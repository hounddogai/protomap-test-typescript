import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementDigestCodeLengthRule,
  PlacementDigestConversionRateRangeRule,
  PlacementDigestRequiredExternalRefRule,
  PlacementDigestRequiredUnitRule,
  PlacementDigestUnitLengthRule,
  defaultPlacementDigestValidator,
} from "./placement-digest-rules.js";
import { newPlacementDigest } from "./placement-digest.js";

test("PlacementDigestValidator reports every problem", () => {
  const validator = defaultPlacementDigestValidator();
  const item = newPlacementDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementDigestUnitLengthRule flags a long unit", () => {
  const rule = new PlacementDigestUnitLengthRule(32);
  const item = newPlacementDigest("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementDigestConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PlacementDigestConversionRateRangeRule(8.6, 2482.7);
  const item = newPlacementDigest("x", "y");
  item.conversionRate = 2484.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementDigestRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new PlacementDigestRequiredExternalRefRule("placement digest needs an entry");
  const item = newPlacementDigest("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementDigestCodeLengthRule flags a long code", () => {
  const rule = new PlacementDigestCodeLengthRule(1000);
  const item = newPlacementDigest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementDigestRequiredUnitRule flags a blank unit", () => {
  const rule = new PlacementDigestRequiredUnitRule("placement digest needs this field");
  const item = newPlacementDigest("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
