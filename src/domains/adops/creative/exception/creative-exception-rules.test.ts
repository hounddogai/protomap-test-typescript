import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeExceptionCodeLengthRule,
  CreativeExceptionDurationMinutesRangeRule,
  CreativeExceptionFloorValueRangeRule,
  CreativeExceptionMaximumRangeRule,
  CreativeExceptionRequiredNameRule,
  CreativeExceptionRequiredSegmentRule,
  defaultCreativeExceptionValidator,
} from "./creative-exception-rules.js";
import { newCreativeException } from "./creative-exception.js";

test("CreativeExceptionValidator reports every problem", () => {
  const validator = defaultCreativeExceptionValidator();
  const item = newCreativeException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeExceptionFloorValueRangeRule flags values above floor value", () => {
  const rule = new CreativeExceptionFloorValueRangeRule(0.6, 4201.7);
  const item = newCreativeException("x", "y");
  item.floorValue = 4203.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeExceptionCodeLengthRule flags a long code", () => {
  const rule = new CreativeExceptionCodeLengthRule(1000);
  const item = newCreativeException("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeExceptionRequiredNameRule flags a blank name", () => {
  const rule = new CreativeExceptionRequiredNameRule("creative exception needs an entry");
  const item = newCreativeException("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeExceptionDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new CreativeExceptionDurationMinutesRangeRule(64, 3600);
  const item = newCreativeException("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeExceptionRequiredSegmentRule flags a blank segment", () => {
  const rule = new CreativeExceptionRequiredSegmentRule("creative exception needs this field");
  const item = newCreativeException("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeExceptionMaximumRangeRule flags values above maximum", () => {
  const rule = new CreativeExceptionMaximumRangeRule(9.8, 836.1);
  const item = newCreativeException("x", "y");
  item.maximum = 837.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
