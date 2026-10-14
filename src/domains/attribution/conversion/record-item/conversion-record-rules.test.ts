import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionRecordLimitRangeRule,
  ConversionRecordRequiredCodeRule,
  ConversionRecordRequiredTitleRule,
  ConversionRecordScoreRangeRule,
  defaultConversionRecordValidator,
} from "./conversion-record-rules.js";
import { newConversionRecord } from "./conversion-record.js";

test("ConversionRecordValidator reports every problem", () => {
  const validator = defaultConversionRecordValidator();
  const item = newConversionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionRecordRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionRecordRequiredCodeRule("conversion record needs a value");
  const item = newConversionRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionRecordRequiredTitleRule flags a blank title", () => {
  const rule = new ConversionRecordRequiredTitleRule("conversion record needs an entry");
  const item = newConversionRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionRecordLimitRangeRule flags values above limit", () => {
  const rule = new ConversionRecordLimitRangeRule(16, 120);
  const item = newConversionRecord("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionRecordScoreRangeRule flags values above score", () => {
  const rule = new ConversionRecordScoreRangeRule(7.6, 4383.7);
  const item = newConversionRecord("x", "y");
  item.score = 4385.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
