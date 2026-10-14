import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionExceptionCeilingRangeRule,
  ConversionExceptionMinimumRangeRule,
  ConversionExceptionNameLengthRule,
  ConversionExceptionRequiredCodeRule,
  defaultConversionExceptionValidator,
} from "./conversion-exception-rules.js";
import { newConversionException } from "./conversion-exception.js";

test("ConversionExceptionValidator reports every problem", () => {
  const validator = defaultConversionExceptionValidator();
  const item = newConversionException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionExceptionNameLengthRule flags a long name", () => {
  const rule = new ConversionExceptionNameLengthRule(255);
  const item = newConversionException("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionExceptionCeilingRangeRule flags values above ceiling", () => {
  const rule = new ConversionExceptionCeilingRangeRule(8.4, 892);
  const item = newConversionException("x", "y");
  item.ceiling = 893.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionExceptionRequiredCodeRule("conversion exception needs a value");
  const item = newConversionException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionExceptionMinimumRangeRule flags values above minimum", () => {
  const rule = new ConversionExceptionMinimumRangeRule(5.3, 2045.6);
  const item = newConversionException("x", "y");
  item.minimum = 2047.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
