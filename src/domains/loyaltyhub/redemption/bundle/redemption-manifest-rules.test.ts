import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionManifestAmountRangeRule,
  RedemptionManifestCodeLengthRule,
  RedemptionManifestRequiredNameRule,
  RedemptionManifestScoreRangeRule,
  defaultRedemptionManifestValidator,
} from "./redemption-manifest-rules.js";
import { newRedemptionManifest } from "./redemption-manifest.js";

test("RedemptionManifestValidator reports every problem", () => {
  const validator = defaultRedemptionManifestValidator();
  const item = newRedemptionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionManifestScoreRangeRule flags values above score", () => {
  const rule = new RedemptionManifestScoreRangeRule(0.9, 4596.1);
  const item = newRedemptionManifest("x", "y");
  item.score = 4597.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionManifestAmountRangeRule flags values above amount", () => {
  const rule = new RedemptionManifestAmountRangeRule(7.6, 3198);
  const item = newRedemptionManifest("x", "y");
  item.amount = 3199.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionManifestRequiredNameRule flags a blank name", () => {
  const rule = new RedemptionManifestRequiredNameRule("redemption manifest needs an entry");
  const item = newRedemptionManifest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionManifestCodeLengthRule flags a long code", () => {
  const rule = new RedemptionManifestCodeLengthRule(86400);
  const item = newRedemptionManifest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
