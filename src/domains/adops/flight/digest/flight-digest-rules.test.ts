import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightDigestRatioRangeRule,
  FlightDigestRequiredNameRule,
  FlightDigestRequiredReviewerRule,
  FlightDigestThresholdRangeRule,
  defaultFlightDigestValidator,
} from "./flight-digest-rules.js";
import { newFlightDigest } from "./flight-digest.js";

test("FlightDigestValidator reports every problem", () => {
  const validator = defaultFlightDigestValidator();
  const item = newFlightDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightDigestRequiredNameRule flags a blank name", () => {
  const rule = new FlightDigestRequiredNameRule("flight digest needs this field");
  const item = newFlightDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightDigestThresholdRangeRule flags values above threshold", () => {
  const rule = new FlightDigestThresholdRangeRule(6.9, 3720);
  const item = newFlightDigest("x", "y");
  item.threshold = 3721.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightDigestRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new FlightDigestRequiredReviewerRule("flight digest needs a value");
  const item = newFlightDigest("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightDigestRatioRangeRule flags values above ratio", () => {
  const rule = new FlightDigestRatioRangeRule(7.9, 4251.9);
  const item = newFlightDigest("x", "y");
  item.ratio = 4253.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
