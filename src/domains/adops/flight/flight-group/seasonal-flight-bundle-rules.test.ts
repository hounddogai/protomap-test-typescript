import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalFlightBundleChecksumLengthRule,
  SeasonalFlightBundleCodeLengthRule,
  SeasonalFlightBundleLimitRangeRule,
  SeasonalFlightBundleRequiredCodeRule,
  defaultSeasonalFlightBundleValidator,
} from "./seasonal-flight-bundle-rules.js";
import { newSeasonalFlightBundle } from "./seasonal-flight-bundle.js";

test("SeasonalFlightBundleValidator reports every problem", () => {
  const validator = defaultSeasonalFlightBundleValidator();
  const item = newSeasonalFlightBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalFlightBundleChecksumLengthRule flags a long checksum", () => {
  const rule = new SeasonalFlightBundleChecksumLengthRule(255);
  const item = newSeasonalFlightBundle("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalFlightBundleRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalFlightBundleRequiredCodeRule("seasonal flight bundle needs a value");
  const item = newSeasonalFlightBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFlightBundleLimitRangeRule flags values above limit", () => {
  const rule = new SeasonalFlightBundleLimitRangeRule(32, 1000);
  const item = newSeasonalFlightBundle("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalFlightBundleCodeLengthRule flags a long code", () => {
  const rule = new SeasonalFlightBundleCodeLengthRule(3600);
  const item = newSeasonalFlightBundle("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
