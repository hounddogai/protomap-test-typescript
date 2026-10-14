import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDoubleOptInBundleChecksumLengthRule,
  LegacyDoubleOptInBundleClicksRangeRule,
  LegacyDoubleOptInBundleRequiredTitleRule,
  defaultLegacyDoubleOptInBundleValidator,
} from "./legacy-double-opt-in-bundle-rules.js";
import { newLegacyDoubleOptInBundle } from "./legacy-double-opt-in-bundle.js";

test("LegacyDoubleOptInBundleValidator reports every problem", () => {
  const validator = defaultLegacyDoubleOptInBundleValidator();
  const item = newLegacyDoubleOptInBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDoubleOptInBundleClicksRangeRule flags values above clicks", () => {
  const rule = new LegacyDoubleOptInBundleClicksRangeRule(255, 86400);
  const item = newLegacyDoubleOptInBundle("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyDoubleOptInBundleChecksumLengthRule flags a long checksum", () => {
  const rule = new LegacyDoubleOptInBundleChecksumLengthRule(64);
  const item = newLegacyDoubleOptInBundle("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDoubleOptInBundleRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyDoubleOptInBundleRequiredTitleRule("legacy double opt in bundle needs this field");
  const item = newLegacyDoubleOptInBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
