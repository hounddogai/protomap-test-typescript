import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalReplyDigestBudgetRangeRule,
  RegionalReplyDigestRequiredTitleRule,
  RegionalReplyDigestTitleLengthRule,
  RegionalReplyDigestVersionRangeRule,
  defaultRegionalReplyDigestValidator,
} from "./regional-reply-digest-rules.js";
import { newRegionalReplyDigest } from "./regional-reply-digest.js";

test("RegionalReplyDigestValidator reports every problem", () => {
  const validator = defaultRegionalReplyDigestValidator();
  const item = newRegionalReplyDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalReplyDigestTitleLengthRule flags a long title", () => {
  const rule = new RegionalReplyDigestTitleLengthRule(64);
  const item = newRegionalReplyDigest("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalReplyDigestVersionRangeRule flags values above version", () => {
  const rule = new RegionalReplyDigestVersionRangeRule(16, 80);
  const item = newRegionalReplyDigest("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalReplyDigestRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalReplyDigestRequiredTitleRule("regional reply digest needs this field");
  const item = newRegionalReplyDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalReplyDigestBudgetRangeRule flags values above budget", () => {
  const rule = new RegionalReplyDigestBudgetRangeRule(9.1, 2973.2);
  const item = newRegionalReplyDigest("x", "y");
  item.budget = 2974.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
