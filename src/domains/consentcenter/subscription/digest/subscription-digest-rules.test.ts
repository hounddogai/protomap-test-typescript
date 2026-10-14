import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionDigestCapacityRangeRule,
  SubscriptionDigestCodeLengthRule,
  SubscriptionDigestNameLengthRule,
  SubscriptionDigestRequiredCodeRule,
  SubscriptionDigestRequiredSourceRule,
  SubscriptionDigestWeightRangeRule,
  defaultSubscriptionDigestValidator,
} from "./subscription-digest-rules.js";
import { newSubscriptionDigest } from "./subscription-digest.js";

test("SubscriptionDigestValidator reports every problem", () => {
  const validator = defaultSubscriptionDigestValidator();
  const item = newSubscriptionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionDigestRequiredSourceRule flags a blank source", () => {
  const rule = new SubscriptionDigestRequiredSourceRule("subscription digest needs a value");
  const item = newSubscriptionDigest("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionDigestCodeLengthRule flags a long code", () => {
  const rule = new SubscriptionDigestCodeLengthRule(1000);
  const item = newSubscriptionDigest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionDigestRequiredCodeRule flags a blank code", () => {
  const rule = new SubscriptionDigestRequiredCodeRule("subscription digest needs an entry");
  const item = newSubscriptionDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionDigestCapacityRangeRule flags values above capacity", () => {
  const rule = new SubscriptionDigestCapacityRangeRule(32, 80);
  const item = newSubscriptionDigest("x", "y");
  item.capacity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionDigestWeightRangeRule flags values above weight", () => {
  const rule = new SubscriptionDigestWeightRangeRule(1, 2332.4);
  const item = newSubscriptionDigest("x", "y");
  item.weight = 2333.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionDigestNameLengthRule flags a long name", () => {
  const rule = new SubscriptionDigestNameLengthRule(1000);
  const item = newSubscriptionDigest("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
