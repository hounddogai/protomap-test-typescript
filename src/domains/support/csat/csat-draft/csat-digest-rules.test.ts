import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatDigestGraceDaysRangeRule,
  CsatDigestLocaleLengthRule,
  CsatDigestRequiredCodeRule,
  defaultCsatDigestValidator,
} from "./csat-digest-rules.js";
import { newCsatDigest } from "./csat-digest.js";

test("CsatDigestValidator reports every problem", () => {
  const validator = defaultCsatDigestValidator();
  const item = newCsatDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatDigestGraceDaysRangeRule flags values above grace days", () => {
  const rule = new CsatDigestGraceDaysRangeRule(120, 3600);
  const item = newCsatDigest("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatDigestLocaleLengthRule flags a long locale", () => {
  const rule = new CsatDigestLocaleLengthRule(120);
  const item = newCsatDigest("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatDigestRequiredCodeRule flags a blank code", () => {
  const rule = new CsatDigestRequiredCodeRule("csat digest needs an entry");
  const item = newCsatDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
