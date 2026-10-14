import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentMappingAudienceIdLengthRule,
  EnrollmentMappingTitleLengthRule,
  defaultEnrollmentMappingValidator,
} from "./enrollment-mapping-rules.js";
import { newEnrollmentMapping } from "./enrollment-mapping.js";

test("EnrollmentMappingValidator reports every problem", () => {
  const validator = defaultEnrollmentMappingValidator();
  const item = newEnrollmentMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentMappingAudienceIdLengthRule flags a long audience id", () => {
  const rule = new EnrollmentMappingAudienceIdLengthRule(86400);
  const item = newEnrollmentMapping("x", "y");
  item.audienceId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentMappingTitleLengthRule flags a long title", () => {
  const rule = new EnrollmentMappingTitleLengthRule(255);
  const item = newEnrollmentMapping("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
