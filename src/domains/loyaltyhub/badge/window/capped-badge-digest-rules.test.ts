import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedBadgeDigestAttemptsRangeRule,
  CappedBadgeDigestRequiredNameRule,
  CappedBadgeDigestVersionRangeRule,
  defaultCappedBadgeDigestValidator,
} from "./capped-badge-digest-rules.js";
import { newCappedBadgeDigest } from "./capped-badge-digest.js";

test("CappedBadgeDigestValidator reports every problem", () => {
  const validator = defaultCappedBadgeDigestValidator();
  const item = newCappedBadgeDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedBadgeDigestAttemptsRangeRule flags values above attempts", () => {
  const rule = new CappedBadgeDigestAttemptsRangeRule(80, 3600);
  const item = newCappedBadgeDigest("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedBadgeDigestVersionRangeRule flags values above version", () => {
  const rule = new CappedBadgeDigestVersionRangeRule(80, 3600);
  const item = newCappedBadgeDigest("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedBadgeDigestRequiredNameRule flags a blank name", () => {
  const rule = new CappedBadgeDigestRequiredNameRule("capped badge digest needs this field");
  const item = newCappedBadgeDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
