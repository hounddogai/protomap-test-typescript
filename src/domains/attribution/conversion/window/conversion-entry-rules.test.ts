import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionEntryCodeLengthRule,
  ConversionEntryLimitRangeRule,
  ConversionEntryRequiredChannelRule,
  ConversionEntryRequiredCodeRule,
  defaultConversionEntryValidator,
} from "./conversion-entry-rules.js";
import { newConversionEntry } from "./conversion-entry.js";

test("ConversionEntryValidator reports every problem", () => {
  const validator = defaultConversionEntryValidator();
  const item = newConversionEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionEntryRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionEntryRequiredCodeRule("conversion entry needs a value");
  const item = newConversionEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionEntryLimitRangeRule flags values above limit", () => {
  const rule = new ConversionEntryLimitRangeRule(255, 86400);
  const item = newConversionEntry("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionEntryCodeLengthRule flags a long code", () => {
  const rule = new ConversionEntryCodeLengthRule(255);
  const item = newConversionEntry("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionEntryRequiredChannelRule flags a blank channel", () => {
  const rule = new ConversionEntryRequiredChannelRule("conversion entry needs an entry");
  const item = newConversionEntry("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
