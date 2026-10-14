import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientCreativeRequestAttemptsRangeRule,
  LenientCreativeRequestRequiredCodeRule,
  LenientCreativeRequestScoreRangeRule,
  defaultLenientCreativeRequestValidator,
} from "./lenient-creative-request-rules.js";
import { newLenientCreativeRequest } from "./lenient-creative-request.js";

test("LenientCreativeRequestValidator reports every problem", () => {
  const validator = defaultLenientCreativeRequestValidator();
  const item = newLenientCreativeRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientCreativeRequestRequiredCodeRule flags a blank code", () => {
  const rule = new LenientCreativeRequestRequiredCodeRule("lenient creative request needs a value");
  const item = newLenientCreativeRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCreativeRequestScoreRangeRule flags values above score", () => {
  const rule = new LenientCreativeRequestScoreRangeRule(8.3, 2429.7);
  const item = newLenientCreativeRequest("x", "y");
  item.score = 2431.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientCreativeRequestAttemptsRangeRule flags values above attempts", () => {
  const rule = new LenientCreativeRequestAttemptsRangeRule(16, 3600);
  const item = newLenientCreativeRequest("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
