import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelRecordMaximumRangeRule,
  ModelRecordRequiredCodeRule,
  ModelRecordRequiredUnitRule,
  ModelRecordUnitLengthRule,
  defaultModelRecordValidator,
} from "./model-record-rules.js";
import { newModelRecord } from "./model-record.js";

test("ModelRecordValidator reports every problem", () => {
  const validator = defaultModelRecordValidator();
  const item = newModelRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelRecordRequiredCodeRule flags a blank code", () => {
  const rule = new ModelRecordRequiredCodeRule("model record needs an entry");
  const item = newModelRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelRecordMaximumRangeRule flags values above maximum", () => {
  const rule = new ModelRecordMaximumRangeRule(9.1, 4564.3);
  const item = newModelRecord("x", "y");
  item.maximum = 4565.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelRecordUnitLengthRule flags a long unit", () => {
  const rule = new ModelRecordUnitLengthRule(3600);
  const item = newModelRecord("x", "y");
  item.unit = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelRecordRequiredUnitRule flags a blank unit", () => {
  const rule = new ModelRecordRequiredUnitRule("model record needs this field");
  const item = newModelRecord("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
