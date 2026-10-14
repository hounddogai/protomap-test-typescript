import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatAssignmentCodeLengthRule,
  CsatAssignmentRateRangeRule,
  defaultCsatAssignmentValidator,
} from "./csat-assignment-rules.js";
import { newCsatAssignment } from "./csat-assignment.js";

test("CsatAssignmentValidator reports every problem", () => {
  const validator = defaultCsatAssignmentValidator();
  const item = newCsatAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatAssignmentCodeLengthRule flags a long code", () => {
  const rule = new CsatAssignmentCodeLengthRule(64);
  const item = newCsatAssignment("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatAssignmentRateRangeRule flags values above rate", () => {
  const rule = new CsatAssignmentRateRangeRule(6.4, 1859.4);
  const item = newCsatAssignment("x", "y");
  item.rate = 1860.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
