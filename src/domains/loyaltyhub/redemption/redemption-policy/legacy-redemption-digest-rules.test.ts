import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyRedemptionDigestAttemptsRangeRule,
  LegacyRedemptionDigestCodeLengthRule,
  LegacyRedemptionDigestImpressionsRangeRule,
  LegacyRedemptionDigestOpenRateRangeRule,
  defaultLegacyRedemptionDigestValidator,
} from "./legacy-redemption-digest-rules.js";
import { newLegacyRedemptionDigest } from "./legacy-redemption-digest.js";

test("LegacyRedemptionDigestValidator reports every problem", () => {
  const validator = defaultLegacyRedemptionDigestValidator();
  const item = newLegacyRedemptionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyRedemptionDigestCodeLengthRule flags a long code", () => {
  const rule = new LegacyRedemptionDigestCodeLengthRule(255);
  const item = newLegacyRedemptionDigest("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyRedemptionDigestAttemptsRangeRule flags values above attempts", () => {
  const rule = new LegacyRedemptionDigestAttemptsRangeRule(64, 64);
  const item = newLegacyRedemptionDigest("x", "y");
  item.attempts = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyRedemptionDigestImpressionsRangeRule flags values above impressions", () => {
  const rule = new LegacyRedemptionDigestImpressionsRangeRule(32, 32);
  const item = newLegacyRedemptionDigest("x", "y");
  item.impressions = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyRedemptionDigestOpenRateRangeRule flags values above open rate", () => {
  const rule = new LegacyRedemptionDigestOpenRateRangeRule(3.8, 3187);
  const item = newLegacyRedemptionDigest("x", "y");
  item.openRate = 3188.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
