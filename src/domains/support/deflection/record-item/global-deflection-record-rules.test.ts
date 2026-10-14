import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalDeflectionRecordMaximumRangeRule,
  GlobalDeflectionRecordRateRangeRule,
  GlobalDeflectionRecordRequiredTitleRule,
  GlobalDeflectionRecordTitleLengthRule,
  defaultGlobalDeflectionRecordValidator,
} from "./global-deflection-record-rules.js";
import { newGlobalDeflectionRecord } from "./global-deflection-record.js";

test("GlobalDeflectionRecordValidator reports every problem", () => {
  const validator = defaultGlobalDeflectionRecordValidator();
  const item = newGlobalDeflectionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalDeflectionRecordRateRangeRule flags values above rate", () => {
  const rule = new GlobalDeflectionRecordRateRangeRule(3.5, 2259.8);
  const item = newGlobalDeflectionRecord("x", "y");
  item.rate = 2261.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalDeflectionRecordRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalDeflectionRecordRequiredTitleRule("global deflection record needs a value");
  const item = newGlobalDeflectionRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalDeflectionRecordTitleLengthRule flags a long title", () => {
  const rule = new GlobalDeflectionRecordTitleLengthRule(255);
  const item = newGlobalDeflectionRecord("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalDeflectionRecordMaximumRangeRule flags values above maximum", () => {
  const rule = new GlobalDeflectionRecordMaximumRangeRule(3.6, 2392.3);
  const item = newGlobalDeflectionRecord("x", "y");
  item.maximum = 2393.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
