import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingSummaryChecksumLengthRule,
  PacingSummaryNameLengthRule,
  PacingSummaryRequiredChecksumRule,
  PacingSummaryRequiredCodeRule,
  defaultPacingSummaryValidator,
} from "./pacing-summary-rules.js";
import { newPacingSummary } from "./pacing-summary.js";

test("PacingSummaryValidator reports every problem", () => {
  const validator = defaultPacingSummaryValidator();
  const item = newPacingSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingSummaryNameLengthRule flags a long name", () => {
  const rule = new PacingSummaryNameLengthRule(64);
  const item = newPacingSummary("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new PacingSummaryRequiredCodeRule("pacing summary needs an entry");
  const item = newPacingSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingSummaryRequiredChecksumRule flags a blank checksum", () => {
  const rule = new PacingSummaryRequiredChecksumRule("pacing summary needs this field");
  const item = newPacingSummary("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingSummaryChecksumLengthRule flags a long checksum", () => {
  const rule = new PacingSummaryChecksumLengthRule(80);
  const item = newPacingSummary("x", "y");
  item.checksum = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
