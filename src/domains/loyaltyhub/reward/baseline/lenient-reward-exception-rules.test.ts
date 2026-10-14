import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientRewardExceptionCodeLengthRule,
  LenientRewardExceptionRequiredCodeRule,
  LenientRewardExceptionRequiredLabelRule,
  LenientRewardExceptionSendAtRangeRule,
  LenientRewardExceptionTimezoneLengthRule,
  defaultLenientRewardExceptionValidator,
} from "./lenient-reward-exception-rules.js";
import { newLenientRewardException } from "./lenient-reward-exception.js";

test("LenientRewardExceptionValidator reports every problem", () => {
  const validator = defaultLenientRewardExceptionValidator();
  const item = newLenientRewardException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientRewardExceptionTimezoneLengthRule flags a long timezone", () => {
  const rule = new LenientRewardExceptionTimezoneLengthRule(32);
  const item = newLenientRewardException("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRewardExceptionSendAtRangeRule flags values above send at", () => {
  const rule = new LenientRewardExceptionSendAtRangeRule(255, 3600);
  const item = newLenientRewardException("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientRewardExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new LenientRewardExceptionRequiredCodeRule("lenient reward exception needs an entry");
  const item = newLenientRewardException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientRewardExceptionCodeLengthRule flags a long code", () => {
  const rule = new LenientRewardExceptionCodeLengthRule(32);
  const item = newLenientRewardException("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRewardExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new LenientRewardExceptionRequiredLabelRule("lenient reward exception needs an entry");
  const item = newLenientRewardException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
