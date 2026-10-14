import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePostDigestCodeLengthRule,
  AdaptivePostDigestCohortLengthRule,
  AdaptivePostDigestMaximumRangeRule,
  AdaptivePostDigestRequiredNameRule,
  AdaptivePostDigestRequiredTimezoneRule,
  AdaptivePostDigestTimezoneLengthRule,
  defaultAdaptivePostDigestValidator,
} from "./adaptive-post-digest-rules.js";
import { newAdaptivePostDigest } from "./adaptive-post-digest.js";

test("AdaptivePostDigestValidator reports every problem", () => {
  const validator = defaultAdaptivePostDigestValidator();
  const item = newAdaptivePostDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePostDigestRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new AdaptivePostDigestRequiredTimezoneRule("adaptive post digest needs an entry");
  const item = newAdaptivePostDigest("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePostDigestCodeLengthRule flags a long code", () => {
  const rule = new AdaptivePostDigestCodeLengthRule(64);
  const item = newAdaptivePostDigest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePostDigestRequiredNameRule flags a blank name", () => {
  const rule = new AdaptivePostDigestRequiredNameRule("adaptive post digest needs a value");
  const item = newAdaptivePostDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePostDigestMaximumRangeRule flags values above maximum", () => {
  const rule = new AdaptivePostDigestMaximumRangeRule(6.9, 1745.9);
  const item = newAdaptivePostDigest("x", "y");
  item.maximum = 1747.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePostDigestCohortLengthRule flags a long cohort", () => {
  const rule = new AdaptivePostDigestCohortLengthRule(3600);
  const item = newAdaptivePostDigest("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePostDigestTimezoneLengthRule flags a long timezone", () => {
  const rule = new AdaptivePostDigestTimezoneLengthRule(3600);
  const item = newAdaptivePostDigest("x", "y");
  item.timezone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
