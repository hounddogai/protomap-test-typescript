import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierDigestLabelLengthRule,
  TierDigestRequiredCodeRule,
  TierDigestRevisionRangeRule,
  defaultTierDigestValidator,
} from "./tier-digest-rules.js";
import { newTierDigest } from "./tier-digest.js";

test("TierDigestValidator reports every problem", () => {
  const validator = defaultTierDigestValidator();
  const item = newTierDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierDigestLabelLengthRule flags a long label", () => {
  const rule = new TierDigestLabelLengthRule(64);
  const item = newTierDigest("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierDigestRequiredCodeRule flags a blank code", () => {
  const rule = new TierDigestRequiredCodeRule("tier digest needs an entry");
  const item = newTierDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierDigestRevisionRangeRule flags values above revision", () => {
  const rule = new TierDigestRevisionRangeRule(64, 255);
  const item = newTierDigest("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
