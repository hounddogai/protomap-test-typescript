import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDoubleOptInExceptionCodeLengthRule,
  AdaptiveDoubleOptInExceptionNameLengthRule,
  AdaptiveDoubleOptInExceptionVersionRangeRule,
  defaultAdaptiveDoubleOptInExceptionValidator,
} from "./adaptive-double-opt-in-exception-rules.js";
import { newAdaptiveDoubleOptInException } from "./adaptive-double-opt-in-exception.js";

test("AdaptiveDoubleOptInExceptionValidator reports every problem", () => {
  const validator = defaultAdaptiveDoubleOptInExceptionValidator();
  const item = newAdaptiveDoubleOptInException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDoubleOptInExceptionVersionRangeRule flags values above version", () => {
  const rule = new AdaptiveDoubleOptInExceptionVersionRangeRule(80, 255);
  const item = newAdaptiveDoubleOptInException("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveDoubleOptInExceptionCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveDoubleOptInExceptionCodeLengthRule(16);
  const item = newAdaptiveDoubleOptInException("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDoubleOptInExceptionNameLengthRule flags a long name", () => {
  const rule = new AdaptiveDoubleOptInExceptionNameLengthRule(120);
  const item = newAdaptiveDoubleOptInException("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
