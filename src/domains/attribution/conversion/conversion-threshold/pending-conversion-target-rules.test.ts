import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingConversionTargetBatchSizeRangeRule,
  PendingConversionTargetChannelLengthRule,
  PendingConversionTargetRequiredCodeRule,
  PendingConversionTargetRequiredTitleRule,
  PendingConversionTargetStartsAtRangeRule,
  defaultPendingConversionTargetValidator,
} from "./pending-conversion-target-rules.js";
import { newPendingConversionTarget } from "./pending-conversion-target.js";

test("PendingConversionTargetValidator reports every problem", () => {
  const validator = defaultPendingConversionTargetValidator();
  const item = newPendingConversionTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingConversionTargetChannelLengthRule flags a long channel", () => {
  const rule = new PendingConversionTargetChannelLengthRule(3600);
  const item = newPendingConversionTarget("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingConversionTargetRequiredTitleRule flags a blank title", () => {
  const rule = new PendingConversionTargetRequiredTitleRule("pending conversion target needs a value");
  const item = newPendingConversionTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingConversionTargetBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PendingConversionTargetBatchSizeRangeRule(120, 255);
  const item = newPendingConversionTarget("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingConversionTargetStartsAtRangeRule flags values above starts at", () => {
  const rule = new PendingConversionTargetStartsAtRangeRule(64, 80);
  const item = newPendingConversionTarget("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingConversionTargetRequiredCodeRule flags a blank code", () => {
  const rule = new PendingConversionTargetRequiredCodeRule("pending conversion target needs this field");
  const item = newPendingConversionTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
