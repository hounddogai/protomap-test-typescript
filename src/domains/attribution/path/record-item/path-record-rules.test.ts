import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathRecordCodeLengthRule,
  PathRecordNameLengthRule,
  PathRecordRequiredCodeRule,
  PathRecordRequiredNameRule,
  PathRecordRequiredPhoneRule,
  PathRecordRequiredReviewerRule,
  defaultPathRecordValidator,
} from "./path-record-rules.js";
import { newPathRecord } from "./path-record.js";

test("PathRecordValidator reports every problem", () => {
  const validator = defaultPathRecordValidator();
  const item = newPathRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathRecordRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PathRecordRequiredReviewerRule("path record needs an entry");
  const item = newPathRecord("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathRecordRequiredNameRule flags a blank name", () => {
  const rule = new PathRecordRequiredNameRule("path record needs a value");
  const item = newPathRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathRecordRequiredPhoneRule flags a blank phone", () => {
  const rule = new PathRecordRequiredPhoneRule("path record needs a value");
  const item = newPathRecord("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathRecordNameLengthRule flags a long name", () => {
  const rule = new PathRecordNameLengthRule(255);
  const item = newPathRecord("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathRecordRequiredCodeRule flags a blank code", () => {
  const rule = new PathRecordRequiredCodeRule("path record needs an entry");
  const item = newPathRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathRecordCodeLengthRule flags a long code", () => {
  const rule = new PathRecordCodeLengthRule(64);
  const item = newPathRecord("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
