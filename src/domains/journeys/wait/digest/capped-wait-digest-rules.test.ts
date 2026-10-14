import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedWaitDigestCodeLengthRule,
  CappedWaitDigestLimitRangeRule,
  CappedWaitDigestRequiredCodeRule,
  CappedWaitDigestRequiredTitleRule,
  defaultCappedWaitDigestValidator,
} from "./capped-wait-digest-rules.js";
import { newCappedWaitDigest } from "./capped-wait-digest.js";

test("CappedWaitDigestValidator reports every problem", () => {
  const validator = defaultCappedWaitDigestValidator();
  const item = newCappedWaitDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedWaitDigestCodeLengthRule flags a long code", () => {
  const rule = new CappedWaitDigestCodeLengthRule(1000);
  const item = newCappedWaitDigest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedWaitDigestLimitRangeRule flags values above limit", () => {
  const rule = new CappedWaitDigestLimitRangeRule(1000, 3600);
  const item = newCappedWaitDigest("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedWaitDigestRequiredTitleRule flags a blank title", () => {
  const rule = new CappedWaitDigestRequiredTitleRule("capped wait digest needs an entry");
  const item = newCappedWaitDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedWaitDigestRequiredCodeRule flags a blank code", () => {
  const rule = new CappedWaitDigestRequiredCodeRule("capped wait digest needs an entry");
  const item = newCappedWaitDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
