import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryConversionMappingLabelLengthRule,
  PrimaryConversionMappingNotesLengthRule,
  PrimaryConversionMappingRequiredCodeRule,
  PrimaryConversionMappingRequiredLocaleRule,
  PrimaryConversionMappingRequiredNotesRule,
  PrimaryConversionMappingWindowDaysRangeRule,
  defaultPrimaryConversionMappingValidator,
} from "./primary-conversion-mapping-rules.js";
import { newPrimaryConversionMapping } from "./primary-conversion-mapping.js";

test("PrimaryConversionMappingValidator reports every problem", () => {
  const validator = defaultPrimaryConversionMappingValidator();
  const item = newPrimaryConversionMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryConversionMappingNotesLengthRule flags a long notes", () => {
  const rule = new PrimaryConversionMappingNotesLengthRule(120);
  const item = newPrimaryConversionMapping("x", "y");
  item.notes = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryConversionMappingRequiredLocaleRule flags a blank locale", () => {
  const rule = new PrimaryConversionMappingRequiredLocaleRule("primary conversion mapping needs this field");
  const item = newPrimaryConversionMapping("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryConversionMappingRequiredNotesRule flags a blank notes", () => {
  const rule = new PrimaryConversionMappingRequiredNotesRule("primary conversion mapping needs a value");
  const item = newPrimaryConversionMapping("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryConversionMappingRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryConversionMappingRequiredCodeRule("primary conversion mapping needs this field");
  const item = newPrimaryConversionMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryConversionMappingLabelLengthRule flags a long label", () => {
  const rule = new PrimaryConversionMappingLabelLengthRule(255);
  const item = newPrimaryConversionMapping("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryConversionMappingWindowDaysRangeRule flags values above window days", () => {
  const rule = new PrimaryConversionMappingWindowDaysRangeRule(16, 80);
  const item = newPrimaryConversionMapping("x", "y");
  item.windowDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
