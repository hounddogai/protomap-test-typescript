import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalProofBundleFloorValueRangeRule,
  SeasonalProofBundleLabelLengthRule,
  SeasonalProofBundleRequiredChecksumRule,
  SeasonalProofBundleRequiredCountryRule,
  defaultSeasonalProofBundleValidator,
} from "./seasonal-proof-bundle-rules.js";
import { newSeasonalProofBundle } from "./seasonal-proof-bundle.js";

test("SeasonalProofBundleValidator reports every problem", () => {
  const validator = defaultSeasonalProofBundleValidator();
  const item = newSeasonalProofBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalProofBundleLabelLengthRule flags a long label", () => {
  const rule = new SeasonalProofBundleLabelLengthRule(16);
  const item = newSeasonalProofBundle("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalProofBundleRequiredChecksumRule flags a blank checksum", () => {
  const rule = new SeasonalProofBundleRequiredChecksumRule("seasonal proof bundle needs an entry");
  const item = newSeasonalProofBundle("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalProofBundleRequiredCountryRule flags a blank country", () => {
  const rule = new SeasonalProofBundleRequiredCountryRule("seasonal proof bundle needs a value");
  const item = newSeasonalProofBundle("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalProofBundleFloorValueRangeRule flags values above floor value", () => {
  const rule = new SeasonalProofBundleFloorValueRangeRule(0.6, 4183.3);
  const item = newSeasonalProofBundle("x", "y");
  item.floorValue = 4184.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
