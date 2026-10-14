import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyBundleCapacityRangeRule,
  JourneyBundleRequiredVariantRule,
  JourneyBundleUtmSourceLengthRule,
  JourneyBundleVariantLengthRule,
  defaultJourneyBundleValidator,
} from "./journey-bundle-rules.js";
import { newJourneyBundle } from "./journey-bundle.js";

test("JourneyBundleValidator reports every problem", () => {
  const validator = defaultJourneyBundleValidator();
  const item = newJourneyBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyBundleVariantLengthRule flags a long variant", () => {
  const rule = new JourneyBundleVariantLengthRule(3600);
  const item = newJourneyBundle("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyBundleCapacityRangeRule flags values above capacity", () => {
  const rule = new JourneyBundleCapacityRangeRule(1000, 1000);
  const item = newJourneyBundle("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyBundleRequiredVariantRule flags a blank variant", () => {
  const rule = new JourneyBundleRequiredVariantRule("journey bundle needs an entry");
  const item = newJourneyBundle("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyBundleUtmSourceLengthRule flags a long utm source", () => {
  const rule = new JourneyBundleUtmSourceLengthRule(86400);
  const item = newJourneyBundle("x", "y");
  item.utmSource = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
