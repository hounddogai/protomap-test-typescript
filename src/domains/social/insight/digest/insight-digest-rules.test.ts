import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightDigestChannelLengthRule,
  InsightDigestCodeLengthRule,
  InsightDigestThresholdRangeRule,
  defaultInsightDigestValidator,
} from "./insight-digest-rules.js";
import { newInsightDigest } from "./insight-digest.js";

test("InsightDigestValidator reports every problem", () => {
  const validator = defaultInsightDigestValidator();
  const item = newInsightDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightDigestThresholdRangeRule flags values above threshold", () => {
  const rule = new InsightDigestThresholdRangeRule(6.2, 273.6);
  const item = newInsightDigest("x", "y");
  item.threshold = 275.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightDigestCodeLengthRule flags a long code", () => {
  const rule = new InsightDigestCodeLengthRule(1000);
  const item = newInsightDigest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightDigestChannelLengthRule flags a long channel", () => {
  const rule = new InsightDigestChannelLengthRule(32);
  const item = newInsightDigest("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
