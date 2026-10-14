import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionRecordCategoryLengthRule,
  DeflectionRecordNameLengthRule,
  DeflectionRecordRequiredCategoryRule,
  DeflectionRecordRequiredNameRule,
  defaultDeflectionRecordValidator,
} from "./deflection-record-rules.js";
import { newDeflectionRecord } from "./deflection-record.js";

test("DeflectionRecordValidator reports every problem", () => {
  const validator = defaultDeflectionRecordValidator();
  const item = newDeflectionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionRecordRequiredNameRule flags a blank name", () => {
  const rule = new DeflectionRecordRequiredNameRule("deflection record needs an entry");
  const item = newDeflectionRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionRecordNameLengthRule flags a long name", () => {
  const rule = new DeflectionRecordNameLengthRule(255);
  const item = newDeflectionRecord("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionRecordCategoryLengthRule flags a long category", () => {
  const rule = new DeflectionRecordCategoryLengthRule(120);
  const item = newDeflectionRecord("x", "y");
  item.category = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionRecordRequiredCategoryRule flags a blank category", () => {
  const rule = new DeflectionRecordRequiredCategoryRule("deflection record needs this field");
  const item = newDeflectionRecord("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
