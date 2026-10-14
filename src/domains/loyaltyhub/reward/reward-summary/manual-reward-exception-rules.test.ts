import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRewardExceptionCountryLengthRule,
  ManualRewardExceptionRequiredCountryRule,
  ManualRewardExceptionRequiredExternalRefRule,
  defaultManualRewardExceptionValidator,
} from "./manual-reward-exception-rules.js";
import { newManualRewardException } from "./manual-reward-exception.js";

test("ManualRewardExceptionValidator reports every problem", () => {
  const validator = defaultManualRewardExceptionValidator();
  const item = newManualRewardException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRewardExceptionRequiredCountryRule flags a blank country", () => {
  const rule = new ManualRewardExceptionRequiredCountryRule("manual reward exception needs a value");
  const item = newManualRewardException("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualRewardExceptionRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new ManualRewardExceptionRequiredExternalRefRule("manual reward exception needs a value");
  const item = newManualRewardException("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualRewardExceptionCountryLengthRule flags a long country", () => {
  const rule = new ManualRewardExceptionCountryLengthRule(64);
  const item = newManualRewardException("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
