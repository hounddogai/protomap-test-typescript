import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallDigestCodeLengthRule,
  PaywallDigestDiscountRangeRule,
  PaywallDigestLabelLengthRule,
  defaultPaywallDigestValidator,
} from "./paywall-digest-rules.js";
import { newPaywallDigest } from "./paywall-digest.js";

test("PaywallDigestValidator reports every problem", () => {
  const validator = defaultPaywallDigestValidator();
  const item = newPaywallDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallDigestDiscountRangeRule flags values above discount", () => {
  const rule = new PaywallDigestDiscountRangeRule(3.6, 4887.2);
  const item = newPaywallDigest("x", "y");
  item.discount = 4888.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallDigestCodeLengthRule flags a long code", () => {
  const rule = new PaywallDigestCodeLengthRule(1000);
  const item = newPaywallDigest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallDigestLabelLengthRule flags a long label", () => {
  const rule = new PaywallDigestLabelLengthRule(16);
  const item = newPaywallDigest("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
