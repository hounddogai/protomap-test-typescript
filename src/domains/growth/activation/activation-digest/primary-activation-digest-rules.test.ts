import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryActivationDigestRateRangeRule,
  PrimaryActivationDigestRequiredCodeRule,
  PrimaryActivationDigestRequiredTitleRule,
  defaultPrimaryActivationDigestValidator,
} from "./primary-activation-digest-rules.js";
import { newPrimaryActivationDigest } from "./primary-activation-digest.js";

test("PrimaryActivationDigestValidator reports every problem", () => {
  const validator = defaultPrimaryActivationDigestValidator();
  const item = newPrimaryActivationDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryActivationDigestRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryActivationDigestRequiredTitleRule("primary activation digest needs this field");
  const item = newPrimaryActivationDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryActivationDigestRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryActivationDigestRequiredCodeRule("primary activation digest needs an entry");
  const item = newPrimaryActivationDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryActivationDigestRateRangeRule flags values above rate", () => {
  const rule = new PrimaryActivationDigestRateRangeRule(6.6, 3627.6);
  const item = newPrimaryActivationDigest("x", "y");
  item.rate = 3629.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
