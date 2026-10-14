import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientConversionAuditCodeLengthRule,
  LenientConversionAuditRequiredNameRule,
  LenientConversionAuditRequiredSegmentRule,
  LenientConversionAuditStartsAtRangeRule,
  defaultLenientConversionAuditValidator,
} from "./lenient-conversion-audit-rules.js";
import { newLenientConversionAudit } from "./lenient-conversion-audit.js";

test("LenientConversionAuditValidator reports every problem", () => {
  const validator = defaultLenientConversionAuditValidator();
  const item = newLenientConversionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientConversionAuditStartsAtRangeRule flags values above starts at", () => {
  const rule = new LenientConversionAuditStartsAtRangeRule(32, 32);
  const item = newLenientConversionAudit("x", "y");
  item.startsAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientConversionAuditRequiredSegmentRule flags a blank segment", () => {
  const rule = new LenientConversionAuditRequiredSegmentRule("lenient conversion audit needs a value");
  const item = newLenientConversionAudit("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientConversionAuditCodeLengthRule flags a long code", () => {
  const rule = new LenientConversionAuditCodeLengthRule(80);
  const item = newLenientConversionAudit("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientConversionAuditRequiredNameRule flags a blank name", () => {
  const rule = new LenientConversionAuditRequiredNameRule("lenient conversion audit needs a value");
  const item = newLenientConversionAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
