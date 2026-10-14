import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalMentionDigestGraceDaysRangeRule,
  RegionalMentionDigestLabelLengthRule,
  RegionalMentionDigestNameLengthRule,
  RegionalMentionDigestRequiredTitleRule,
  defaultRegionalMentionDigestValidator,
} from "./regional-mention-digest-rules.js";
import { newRegionalMentionDigest } from "./regional-mention-digest.js";

test("RegionalMentionDigestValidator reports every problem", () => {
  const validator = defaultRegionalMentionDigestValidator();
  const item = newRegionalMentionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalMentionDigestLabelLengthRule flags a long label", () => {
  const rule = new RegionalMentionDigestLabelLengthRule(255);
  const item = newRegionalMentionDigest("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalMentionDigestGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RegionalMentionDigestGraceDaysRangeRule(32, 255);
  const item = newRegionalMentionDigest("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalMentionDigestRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalMentionDigestRequiredTitleRule("regional mention digest needs a value");
  const item = newRegionalMentionDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalMentionDigestNameLengthRule flags a long name", () => {
  const rule = new RegionalMentionDigestNameLengthRule(32);
  const item = newRegionalMentionDigest("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
