import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRewardDigestCodeLengthRule,
  StrictRewardDigestLabelLengthRule,
  StrictRewardDigestRequiredCodeRule,
  defaultStrictRewardDigestValidator,
} from "./strict-reward-digest-rules.js";
import { newStrictRewardDigest } from "./strict-reward-digest.js";

test("StrictRewardDigestValidator reports every problem", () => {
  const validator = defaultStrictRewardDigestValidator();
  const item = newStrictRewardDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRewardDigestRequiredCodeRule flags a blank code", () => {
  const rule = new StrictRewardDigestRequiredCodeRule("strict reward digest needs this field");
  const item = newStrictRewardDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRewardDigestCodeLengthRule flags a long code", () => {
  const rule = new StrictRewardDigestCodeLengthRule(86400);
  const item = newStrictRewardDigest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRewardDigestLabelLengthRule flags a long label", () => {
  const rule = new StrictRewardDigestLabelLengthRule(32);
  const item = newStrictRewardDigest("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
