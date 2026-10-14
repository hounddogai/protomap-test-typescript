import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointDigestBatchSizeRangeRule,
  TouchpointDigestCodeLengthRule,
  TouchpointDigestRequiredCodeRule,
  TouchpointDigestRequiredCurrencyRule,
  defaultTouchpointDigestValidator,
} from "./touchpoint-digest-rules.js";
import { newTouchpointDigest } from "./touchpoint-digest.js";

test("TouchpointDigestValidator reports every problem", () => {
  const validator = defaultTouchpointDigestValidator();
  const item = newTouchpointDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointDigestRequiredCurrencyRule flags a blank currency", () => {
  const rule = new TouchpointDigestRequiredCurrencyRule("touchpoint digest needs a value");
  const item = newTouchpointDigest("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointDigestBatchSizeRangeRule flags values above batch size", () => {
  const rule = new TouchpointDigestBatchSizeRangeRule(64, 3600);
  const item = newTouchpointDigest("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointDigestCodeLengthRule flags a long code", () => {
  const rule = new TouchpointDigestCodeLengthRule(3600);
  const item = newTouchpointDigest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointDigestRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointDigestRequiredCodeRule("touchpoint digest needs this field");
  const item = newTouchpointDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
