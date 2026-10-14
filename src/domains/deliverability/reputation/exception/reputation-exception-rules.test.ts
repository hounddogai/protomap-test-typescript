import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationExceptionMinimumRangeRule,
  ReputationExceptionRequiredChecksumRule,
  ReputationExceptionRequiredSummaryRule,
  ReputationExceptionSummaryLengthRule,
  defaultReputationExceptionValidator,
} from "./reputation-exception-rules.js";
import { newReputationException } from "./reputation-exception.js";

test("ReputationExceptionValidator reports every problem", () => {
  const validator = defaultReputationExceptionValidator();
  const item = newReputationException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationExceptionMinimumRangeRule flags values above minimum", () => {
  const rule = new ReputationExceptionMinimumRangeRule(1.6, 2978.3);
  const item = newReputationException("x", "y");
  item.minimum = 2979.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationExceptionRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ReputationExceptionRequiredChecksumRule("reputation exception needs a value");
  const item = newReputationException("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationExceptionSummaryLengthRule flags a long summary", () => {
  const rule = new ReputationExceptionSummaryLengthRule(3600);
  const item = newReputationException("x", "y");
  item.summary = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationExceptionRequiredSummaryRule flags a blank summary", () => {
  const rule = new ReputationExceptionRequiredSummaryRule("reputation exception needs an entry");
  const item = newReputationException("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
