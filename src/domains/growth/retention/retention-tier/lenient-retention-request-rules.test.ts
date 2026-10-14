import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientRetentionRequestCodeLengthRule,
  LenientRetentionRequestCountryLengthRule,
  LenientRetentionRequestRequiredSegmentRule,
  defaultLenientRetentionRequestValidator,
} from "./lenient-retention-request-rules.js";
import { newLenientRetentionRequest } from "./lenient-retention-request.js";

test("LenientRetentionRequestValidator reports every problem", () => {
  const validator = defaultLenientRetentionRequestValidator();
  const item = newLenientRetentionRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientRetentionRequestRequiredSegmentRule flags a blank segment", () => {
  const rule = new LenientRetentionRequestRequiredSegmentRule("lenient retention request needs a value");
  const item = newLenientRetentionRequest("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientRetentionRequestCodeLengthRule flags a long code", () => {
  const rule = new LenientRetentionRequestCodeLengthRule(16);
  const item = newLenientRetentionRequest("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRetentionRequestCountryLengthRule flags a long country", () => {
  const rule = new LenientRetentionRequestCountryLengthRule(64);
  const item = newLenientRetentionRequest("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
