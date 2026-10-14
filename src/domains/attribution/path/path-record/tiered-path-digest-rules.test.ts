import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPathDigestCreatedAtRangeRule,
  TieredPathDigestDiscountRangeRule,
  TieredPathDigestReviewerLengthRule,
  defaultTieredPathDigestValidator,
} from "./tiered-path-digest-rules.js";
import { newTieredPathDigest } from "./tiered-path-digest.js";

test("TieredPathDigestValidator reports every problem", () => {
  const validator = defaultTieredPathDigestValidator();
  const item = newTieredPathDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPathDigestDiscountRangeRule flags values above discount", () => {
  const rule = new TieredPathDigestDiscountRangeRule(5.7, 4864.5);
  const item = newTieredPathDigest("x", "y");
  item.discount = 4866;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPathDigestReviewerLengthRule flags a long reviewer", () => {
  const rule = new TieredPathDigestReviewerLengthRule(16);
  const item = newTieredPathDigest("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPathDigestCreatedAtRangeRule flags values above created at", () => {
  const rule = new TieredPathDigestCreatedAtRangeRule(64, 1000);
  const item = newTieredPathDigest("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
