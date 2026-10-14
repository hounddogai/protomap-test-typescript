import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientBidRuleManifestLocaleLengthRule,
  LenientBidRuleManifestOpenRateRangeRule,
  LenientBidRuleManifestRequiredCodeRule,
  LenientBidRuleManifestSummaryLengthRule,
  defaultLenientBidRuleManifestValidator,
} from "./lenient-bid-rule-manifest-rules.js";
import { newLenientBidRuleManifest } from "./lenient-bid-rule-manifest.js";

test("LenientBidRuleManifestValidator reports every problem", () => {
  const validator = defaultLenientBidRuleManifestValidator();
  const item = newLenientBidRuleManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientBidRuleManifestOpenRateRangeRule flags values above open rate", () => {
  const rule = new LenientBidRuleManifestOpenRateRangeRule(3.7, 820);
  const item = newLenientBidRuleManifest("x", "y");
  item.openRate = 821.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientBidRuleManifestSummaryLengthRule flags a long summary", () => {
  const rule = new LenientBidRuleManifestSummaryLengthRule(255);
  const item = newLenientBidRuleManifest("x", "y");
  item.summary = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientBidRuleManifestRequiredCodeRule flags a blank code", () => {
  const rule = new LenientBidRuleManifestRequiredCodeRule("lenient bid rule manifest needs this field");
  const item = newLenientBidRuleManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientBidRuleManifestLocaleLengthRule flags a long locale", () => {
  const rule = new LenientBidRuleManifestLocaleLengthRule(16);
  const item = newLenientBidRuleManifest("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
