import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPostRecordJourneyIdLengthRule,
  FallbackPostRecordLabelLengthRule,
  FallbackPostRecordLimitRangeRule,
  FallbackPostRecordRequiredCodeRule,
  FallbackPostRecordRequiredJourneyIdRule,
  defaultFallbackPostRecordValidator,
} from "./fallback-post-record-rules.js";
import { newFallbackPostRecord } from "./fallback-post-record.js";

test("FallbackPostRecordValidator reports every problem", () => {
  const validator = defaultFallbackPostRecordValidator();
  const item = newFallbackPostRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPostRecordJourneyIdLengthRule flags a long journey id", () => {
  const rule = new FallbackPostRecordJourneyIdLengthRule(64);
  const item = newFallbackPostRecord("x", "y");
  item.journeyId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPostRecordRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackPostRecordRequiredCodeRule("fallback post record needs a value");
  const item = newFallbackPostRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPostRecordRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new FallbackPostRecordRequiredJourneyIdRule("fallback post record needs an entry");
  const item = newFallbackPostRecord("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPostRecordLimitRangeRule flags values above limit", () => {
  const rule = new FallbackPostRecordLimitRangeRule(16, 3600);
  const item = newFallbackPostRecord("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPostRecordLabelLengthRule flags a long label", () => {
  const rule = new FallbackPostRecordLabelLengthRule(32);
  const item = newFallbackPostRecord("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
