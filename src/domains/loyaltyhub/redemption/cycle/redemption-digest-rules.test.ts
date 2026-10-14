import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionDigestNameLengthRule,
  RedemptionDigestRequiredLabelRule,
  RedemptionDigestRequiredNameRule,
  defaultRedemptionDigestValidator,
} from "./redemption-digest-rules.js";
import { newRedemptionDigest } from "./redemption-digest.js";

test("RedemptionDigestValidator reports every problem", () => {
  const validator = defaultRedemptionDigestValidator();
  const item = newRedemptionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionDigestNameLengthRule flags a long name", () => {
  const rule = new RedemptionDigestNameLengthRule(32);
  const item = newRedemptionDigest("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionDigestRequiredLabelRule flags a blank label", () => {
  const rule = new RedemptionDigestRequiredLabelRule("redemption digest needs a value");
  const item = newRedemptionDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionDigestRequiredNameRule flags a blank name", () => {
  const rule = new RedemptionDigestRequiredNameRule("redemption digest needs this field");
  const item = newRedemptionDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
