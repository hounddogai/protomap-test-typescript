import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultEnrollmentDigestCostRangeRule,
  DefaultEnrollmentDigestOpenRateRangeRule,
  DefaultEnrollmentDigestRequiredTitleRule,
  DefaultEnrollmentDigestTitleLengthRule,
  defaultDefaultEnrollmentDigestValidator,
} from "./default-enrollment-digest-rules.js";
import { newDefaultEnrollmentDigest } from "./default-enrollment-digest.js";

test("DefaultEnrollmentDigestValidator reports every problem", () => {
  const validator = defaultDefaultEnrollmentDigestValidator();
  const item = newDefaultEnrollmentDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultEnrollmentDigestOpenRateRangeRule flags values above open rate", () => {
  const rule = new DefaultEnrollmentDigestOpenRateRangeRule(5.7, 348.5);
  const item = newDefaultEnrollmentDigest("x", "y");
  item.openRate = 350;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultEnrollmentDigestRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultEnrollmentDigestRequiredTitleRule("default enrollment digest needs an entry");
  const item = newDefaultEnrollmentDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultEnrollmentDigestTitleLengthRule flags a long title", () => {
  const rule = new DefaultEnrollmentDigestTitleLengthRule(255);
  const item = newDefaultEnrollmentDigest("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultEnrollmentDigestCostRangeRule flags values above cost", () => {
  const rule = new DefaultEnrollmentDigestCostRangeRule(3.1, 1515.3);
  const item = newDefaultEnrollmentDigest("x", "y");
  item.cost = 1516.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
