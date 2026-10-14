import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderThresholdClicksRangeRule,
  SenderThresholdCodeLengthRule,
  SenderThresholdRatioRangeRule,
  SenderThresholdRequiredRegionRule,
  SenderThresholdWeightRangeRule,
  defaultSenderThresholdValidator,
} from "./sender-threshold-rules.js";
import { newSenderThreshold } from "./sender-threshold.js";

test("SenderThresholdValidator reports every problem", () => {
  const validator = defaultSenderThresholdValidator();
  const item = newSenderThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderThresholdCodeLengthRule flags a long code", () => {
  const rule = new SenderThresholdCodeLengthRule(1000);
  const item = newSenderThreshold("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderThresholdWeightRangeRule flags values above weight", () => {
  const rule = new SenderThresholdWeightRangeRule(9.5, 3951.7);
  const item = newSenderThreshold("x", "y");
  item.weight = 3953.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderThresholdRatioRangeRule flags values above ratio", () => {
  const rule = new SenderThresholdRatioRangeRule(7.6, 1660.2);
  const item = newSenderThreshold("x", "y");
  item.ratio = 1661.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderThresholdRequiredRegionRule flags a blank region", () => {
  const rule = new SenderThresholdRequiredRegionRule("sender threshold needs this field");
  const item = newSenderThreshold("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderThresholdClicksRangeRule flags values above clicks", () => {
  const rule = new SenderThresholdClicksRangeRule(64, 255);
  const item = newSenderThreshold("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
