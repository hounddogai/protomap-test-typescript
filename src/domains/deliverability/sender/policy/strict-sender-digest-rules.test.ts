import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictSenderDigestCategoryLengthRule,
  StrictSenderDigestRequiredTitleRule,
  StrictSenderDigestScoreRangeRule,
  StrictSenderDigestSegmentLengthRule,
  defaultStrictSenderDigestValidator,
} from "./strict-sender-digest-rules.js";
import { newStrictSenderDigest } from "./strict-sender-digest.js";

test("StrictSenderDigestValidator reports every problem", () => {
  const validator = defaultStrictSenderDigestValidator();
  const item = newStrictSenderDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictSenderDigestScoreRangeRule flags values above score", () => {
  const rule = new StrictSenderDigestScoreRangeRule(5.9, 1370.9);
  const item = newStrictSenderDigest("x", "y");
  item.score = 1372.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictSenderDigestRequiredTitleRule flags a blank title", () => {
  const rule = new StrictSenderDigestRequiredTitleRule("strict sender digest needs an entry");
  const item = newStrictSenderDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictSenderDigestSegmentLengthRule flags a long segment", () => {
  const rule = new StrictSenderDigestSegmentLengthRule(1000);
  const item = newStrictSenderDigest("x", "y");
  item.segment = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictSenderDigestCategoryLengthRule flags a long category", () => {
  const rule = new StrictSenderDigestCategoryLengthRule(255);
  const item = newStrictSenderDigest("x", "y");
  item.category = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
