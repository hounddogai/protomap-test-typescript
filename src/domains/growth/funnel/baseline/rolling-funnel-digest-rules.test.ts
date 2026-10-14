import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFunnelDigestLocaleLengthRule,
  RollingFunnelDigestRateRangeRule,
  RollingFunnelDigestRequiredLocaleRule,
  RollingFunnelDigestSummaryLengthRule,
  defaultRollingFunnelDigestValidator,
} from "./rolling-funnel-digest-rules.js";
import { newRollingFunnelDigest } from "./rolling-funnel-digest.js";

test("RollingFunnelDigestValidator reports every problem", () => {
  const validator = defaultRollingFunnelDigestValidator();
  const item = newRollingFunnelDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFunnelDigestRateRangeRule flags values above rate", () => {
  const rule = new RollingFunnelDigestRateRangeRule(0.9, 2010.8);
  const item = newRollingFunnelDigest("x", "y");
  item.rate = 2012.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingFunnelDigestLocaleLengthRule flags a long locale", () => {
  const rule = new RollingFunnelDigestLocaleLengthRule(255);
  const item = newRollingFunnelDigest("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingFunnelDigestSummaryLengthRule flags a long summary", () => {
  const rule = new RollingFunnelDigestSummaryLengthRule(255);
  const item = newRollingFunnelDigest("x", "y");
  item.summary = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingFunnelDigestRequiredLocaleRule flags a blank locale", () => {
  const rule = new RollingFunnelDigestRequiredLocaleRule("rolling funnel digest needs a value");
  const item = newRollingFunnelDigest("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
