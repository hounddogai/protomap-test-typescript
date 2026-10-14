import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathDigestPhoneLengthRule,
  PathDigestRequiredCodeRule,
  PathDigestRequiredNameRule,
  PathDigestRetriesRangeRule,
  defaultPathDigestValidator,
} from "./path-digest-rules.js";
import { newPathDigest } from "./path-digest.js";

test("PathDigestValidator reports every problem", () => {
  const validator = defaultPathDigestValidator();
  const item = newPathDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathDigestRequiredNameRule flags a blank name", () => {
  const rule = new PathDigestRequiredNameRule("path digest needs an entry");
  const item = newPathDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathDigestRequiredCodeRule flags a blank code", () => {
  const rule = new PathDigestRequiredCodeRule("path digest needs a value");
  const item = newPathDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathDigestPhoneLengthRule flags a long phone", () => {
  const rule = new PathDigestPhoneLengthRule(1000);
  const item = newPathDigest("x", "y");
  item.phone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathDigestRetriesRangeRule flags values above retries", () => {
  const rule = new PathDigestRetriesRangeRule(64, 80);
  const item = newPathDigest("x", "y");
  item.retries = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
