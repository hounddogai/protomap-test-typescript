import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedCreditDigestChecksumLengthRule,
  WeightedCreditDigestCreatedAtRangeRule,
  WeightedCreditDigestRequiredChecksumRule,
  WeightedCreditDigestRequiredTitleRule,
  WeightedCreditDigestTitleLengthRule,
  defaultWeightedCreditDigestValidator,
} from "./weighted-credit-digest-rules.js";
import { newWeightedCreditDigest } from "./weighted-credit-digest.js";

test("WeightedCreditDigestValidator reports every problem", () => {
  const validator = defaultWeightedCreditDigestValidator();
  const item = newWeightedCreditDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedCreditDigestRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedCreditDigestRequiredTitleRule("weighted credit digest needs a value");
  const item = newWeightedCreditDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedCreditDigestChecksumLengthRule flags a long checksum", () => {
  const rule = new WeightedCreditDigestChecksumLengthRule(255);
  const item = newWeightedCreditDigest("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedCreditDigestCreatedAtRangeRule flags values above created at", () => {
  const rule = new WeightedCreditDigestCreatedAtRangeRule(3600, 86400);
  const item = newWeightedCreditDigest("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedCreditDigestTitleLengthRule flags a long title", () => {
  const rule = new WeightedCreditDigestTitleLengthRule(80);
  const item = newWeightedCreditDigest("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedCreditDigestRequiredChecksumRule flags a blank checksum", () => {
  const rule = new WeightedCreditDigestRequiredChecksumRule("weighted credit digest needs an entry");
  const item = newWeightedCreditDigest("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
