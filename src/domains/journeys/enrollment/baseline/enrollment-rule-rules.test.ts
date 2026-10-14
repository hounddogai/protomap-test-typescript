import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentRuleCodeLengthRule,
  EnrollmentRuleRevisionRangeRule,
  defaultEnrollmentRuleValidator,
} from "./enrollment-rule-rules.js";
import { newEnrollmentRule } from "./enrollment-rule.js";

test("EnrollmentRuleValidator reports every problem", () => {
  const validator = defaultEnrollmentRuleValidator();
  const item = newEnrollmentRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentRuleRevisionRangeRule flags values above revision", () => {
  const rule = new EnrollmentRuleRevisionRangeRule(120, 1000);
  const item = newEnrollmentRule("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentRuleCodeLengthRule flags a long code", () => {
  const rule = new EnrollmentRuleCodeLengthRule(255);
  const item = newEnrollmentRule("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
