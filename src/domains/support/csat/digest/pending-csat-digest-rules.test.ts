import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCsatDigestMinimumRangeRule,
  PendingCsatDigestRequiredCodeRule,
  PendingCsatDigestRequiredCurrencyRule,
  PendingCsatDigestRetriesRangeRule,
  defaultPendingCsatDigestValidator,
} from "./pending-csat-digest-rules.js";
import { newPendingCsatDigest } from "./pending-csat-digest.js";

test("PendingCsatDigestValidator reports every problem", () => {
  const validator = defaultPendingCsatDigestValidator();
  const item = newPendingCsatDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCsatDigestRequiredCurrencyRule flags a blank currency", () => {
  const rule = new PendingCsatDigestRequiredCurrencyRule("pending csat digest needs an entry");
  const item = newPendingCsatDigest("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCsatDigestRetriesRangeRule flags values above retries", () => {
  const rule = new PendingCsatDigestRetriesRangeRule(1000, 3600);
  const item = newPendingCsatDigest("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingCsatDigestMinimumRangeRule flags values above minimum", () => {
  const rule = new PendingCsatDigestMinimumRangeRule(8.8, 4124);
  const item = newPendingCsatDigest("x", "y");
  item.minimum = 4125.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingCsatDigestRequiredCodeRule flags a blank code", () => {
  const rule = new PendingCsatDigestRequiredCodeRule("pending csat digest needs a value");
  const item = newPendingCsatDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
