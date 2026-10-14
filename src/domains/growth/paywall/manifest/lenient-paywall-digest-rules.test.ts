import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPaywallDigestCodeLengthRule,
  LenientPaywallDigestMarginRangeRule,
  LenientPaywallDigestRequiredLabelRule,
  LenientPaywallDigestScoreRangeRule,
  LenientPaywallDigestSourceLengthRule,
  defaultLenientPaywallDigestValidator,
} from "./lenient-paywall-digest-rules.js";
import { newLenientPaywallDigest } from "./lenient-paywall-digest.js";

test("LenientPaywallDigestValidator reports every problem", () => {
  const validator = defaultLenientPaywallDigestValidator();
  const item = newLenientPaywallDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPaywallDigestMarginRangeRule flags values above margin", () => {
  const rule = new LenientPaywallDigestMarginRangeRule(7.3, 550.8);
  const item = newLenientPaywallDigest("x", "y");
  item.margin = 552.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPaywallDigestCodeLengthRule flags a long code", () => {
  const rule = new LenientPaywallDigestCodeLengthRule(32);
  const item = newLenientPaywallDigest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPaywallDigestSourceLengthRule flags a long source", () => {
  const rule = new LenientPaywallDigestSourceLengthRule(120);
  const item = newLenientPaywallDigest("x", "y");
  item.source = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPaywallDigestScoreRangeRule flags values above score", () => {
  const rule = new LenientPaywallDigestScoreRangeRule(5.5, 2950.4);
  const item = newLenientPaywallDigest("x", "y");
  item.score = 2951.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPaywallDigestRequiredLabelRule flags a blank label", () => {
  const rule = new LenientPaywallDigestRequiredLabelRule("lenient paywall digest needs a value");
  const item = newLenientPaywallDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
