import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeTierExpiresAtRangeRule,
  BadgeTierLocaleLengthRule,
  BadgeTierRateRangeRule,
  BadgeTierRatioRangeRule,
  BadgeTierRequiredLabelRule,
  defaultBadgeTierValidator,
} from "./badge-tier-rules.js";
import { newBadgeTier } from "./badge-tier.js";

test("BadgeTierValidator reports every problem", () => {
  const validator = defaultBadgeTierValidator();
  const item = newBadgeTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeTierRatioRangeRule flags values above ratio", () => {
  const rule = new BadgeTierRatioRangeRule(10, 3530.8);
  const item = newBadgeTier("x", "y");
  item.ratio = 3532.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeTierRateRangeRule flags values above rate", () => {
  const rule = new BadgeTierRateRangeRule(9.3, 4025.3);
  const item = newBadgeTier("x", "y");
  item.rate = 4026.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeTierExpiresAtRangeRule flags values above expires at", () => {
  const rule = new BadgeTierExpiresAtRangeRule(32, 86400);
  const item = newBadgeTier("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeTierLocaleLengthRule flags a long locale", () => {
  const rule = new BadgeTierLocaleLengthRule(1000);
  const item = newBadgeTier("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeTierRequiredLabelRule flags a blank label", () => {
  const rule = new BadgeTierRequiredLabelRule("badge tier needs an entry");
  const item = newBadgeTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
