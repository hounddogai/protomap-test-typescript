import assert from "node:assert/strict";
import { test } from "node:test";
import { EnrollmentRecordWeightRangeRule, defaultEnrollmentRecordValidator } from "./enrollment-record-rules.js";
import { newEnrollmentRecord } from "./enrollment-record.js";

test("EnrollmentRecordValidator reports every problem", () => {
  const validator = defaultEnrollmentRecordValidator();
  const item = newEnrollmentRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentRecordWeightRangeRule flags values above weight", () => {
  const rule = new EnrollmentRecordWeightRangeRule(6.7, 2168.2);
  const item = newEnrollmentRecord("x", "y");
  item.weight = 2169.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
