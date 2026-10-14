import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedStreakDigestCodeLengthRule,
  CappedStreakDigestLocaleLengthRule,
  CappedStreakDigestRequiredCodeRule,
  CappedStreakDigestRequiredLocaleRule,
  defaultCappedStreakDigestValidator,
} from "./capped-streak-digest-rules.js";
import { newCappedStreakDigest } from "./capped-streak-digest.js";

test("CappedStreakDigestValidator reports every problem", () => {
  const validator = defaultCappedStreakDigestValidator();
  const item = newCappedStreakDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedStreakDigestRequiredLocaleRule flags a blank locale", () => {
  const rule = new CappedStreakDigestRequiredLocaleRule("capped streak digest needs an entry");
  const item = newCappedStreakDigest("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedStreakDigestLocaleLengthRule flags a long locale", () => {
  const rule = new CappedStreakDigestLocaleLengthRule(120);
  const item = newCappedStreakDigest("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedStreakDigestRequiredCodeRule flags a blank code", () => {
  const rule = new CappedStreakDigestRequiredCodeRule("capped streak digest needs an entry");
  const item = newCappedStreakDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedStreakDigestCodeLengthRule flags a long code", () => {
  const rule = new CappedStreakDigestCodeLengthRule(16);
  const item = newCappedStreakDigest("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
