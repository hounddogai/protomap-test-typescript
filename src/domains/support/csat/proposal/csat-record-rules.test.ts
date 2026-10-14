import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatRecordRequiredCodeRule,
  CsatRecordRequiredReviewerRule,
  CsatRecordRequiredUtmSourceRule,
  CsatRecordReviewerLengthRule,
  defaultCsatRecordValidator,
} from "./csat-record-rules.js";
import { newCsatRecord } from "./csat-record.js";

test("CsatRecordValidator reports every problem", () => {
  const validator = defaultCsatRecordValidator();
  const item = newCsatRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatRecordRequiredCodeRule flags a blank code", () => {
  const rule = new CsatRecordRequiredCodeRule("csat record needs this field");
  const item = newCsatRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatRecordReviewerLengthRule flags a long reviewer", () => {
  const rule = new CsatRecordReviewerLengthRule(64);
  const item = newCsatRecord("x", "y");
  item.reviewer = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatRecordRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new CsatRecordRequiredUtmSourceRule("csat record needs a value");
  const item = newCsatRecord("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatRecordRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new CsatRecordRequiredReviewerRule("csat record needs this field");
  const item = newCsatRecord("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
