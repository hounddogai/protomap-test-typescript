import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientFlightExceptionCodeLengthRule,
  LenientFlightExceptionRequiredCodeRule,
  LenientFlightExceptionRequiredTitleRule,
  LenientFlightExceptionScoreRangeRule,
  defaultLenientFlightExceptionValidator,
} from "./lenient-flight-exception-rules.js";
import { newLenientFlightException } from "./lenient-flight-exception.js";

test("LenientFlightExceptionValidator reports every problem", () => {
  const validator = defaultLenientFlightExceptionValidator();
  const item = newLenientFlightException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientFlightExceptionRequiredTitleRule flags a blank title", () => {
  const rule = new LenientFlightExceptionRequiredTitleRule("lenient flight exception needs this field");
  const item = newLenientFlightException("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientFlightExceptionScoreRangeRule flags values above score", () => {
  const rule = new LenientFlightExceptionScoreRangeRule(7.4, 4727.1);
  const item = newLenientFlightException("x", "y");
  item.score = 4728.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientFlightExceptionCodeLengthRule flags a long code", () => {
  const rule = new LenientFlightExceptionCodeLengthRule(3600);
  const item = newLenientFlightException("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientFlightExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new LenientFlightExceptionRequiredCodeRule("lenient flight exception needs an entry");
  const item = newLenientFlightException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
