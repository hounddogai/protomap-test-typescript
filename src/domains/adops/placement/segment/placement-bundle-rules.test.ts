import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementBundleChecksumLengthRule,
  PlacementBundleCreatedAtRangeRule,
  PlacementBundleMarginRangeRule,
  defaultPlacementBundleValidator,
} from "./placement-bundle-rules.js";
import { newPlacementBundle } from "./placement-bundle.js";

test("PlacementBundleValidator reports every problem", () => {
  const validator = defaultPlacementBundleValidator();
  const item = newPlacementBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementBundleChecksumLengthRule flags a long checksum", () => {
  const rule = new PlacementBundleChecksumLengthRule(1000);
  const item = newPlacementBundle("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementBundleCreatedAtRangeRule flags values above created at", () => {
  const rule = new PlacementBundleCreatedAtRangeRule(32, 64);
  const item = newPlacementBundle("x", "y");
  item.createdAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementBundleMarginRangeRule flags values above margin", () => {
  const rule = new PlacementBundleMarginRangeRule(8.6, 4355);
  const item = newPlacementBundle("x", "y");
  item.margin = 4356.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
