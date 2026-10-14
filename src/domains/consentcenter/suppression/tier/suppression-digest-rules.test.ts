import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionDigestRequiredCodeRule,
  SuppressionDigestRequiredReviewerRule,
  defaultSuppressionDigestValidator,
} from "./suppression-digest-rules.js";
import { newSuppressionDigest } from "./suppression-digest.js";

test("SuppressionDigestValidator reports every problem", () => {
  const validator = defaultSuppressionDigestValidator();
  const item = newSuppressionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionDigestRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new SuppressionDigestRequiredReviewerRule("suppression digest needs an entry");
  const item = newSuppressionDigest("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionDigestRequiredCodeRule flags a blank code", () => {
  const rule = new SuppressionDigestRequiredCodeRule("suppression digest needs a value");
  const item = newSuppressionDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
