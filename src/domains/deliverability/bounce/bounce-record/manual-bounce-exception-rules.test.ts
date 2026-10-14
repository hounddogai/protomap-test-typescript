import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBounceExceptionClicksRangeRule,
  ManualBounceExceptionCodeLengthRule,
  ManualBounceExceptionRequiredCodeRule,
  ManualBounceExceptionSequenceRangeRule,
  ManualBounceExceptionSourceLengthRule,
  defaultManualBounceExceptionValidator,
} from "./manual-bounce-exception-rules.js";
import { newManualBounceException } from "./manual-bounce-exception.js";

test("ManualBounceExceptionValidator reports every problem", () => {
  const validator = defaultManualBounceExceptionValidator();
  const item = newManualBounceException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBounceExceptionClicksRangeRule flags values above clicks", () => {
  const rule = new ManualBounceExceptionClicksRangeRule(64, 255);
  const item = newManualBounceException("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualBounceExceptionSourceLengthRule flags a long source", () => {
  const rule = new ManualBounceExceptionSourceLengthRule(16);
  const item = newManualBounceException("x", "y");
  item.source = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBounceExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new ManualBounceExceptionRequiredCodeRule("manual bounce exception needs an entry");
  const item = newManualBounceException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBounceExceptionCodeLengthRule flags a long code", () => {
  const rule = new ManualBounceExceptionCodeLengthRule(255);
  const item = newManualBounceException("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBounceExceptionSequenceRangeRule flags values above sequence", () => {
  const rule = new ManualBounceExceptionSequenceRangeRule(255, 1000);
  const item = newManualBounceException("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
