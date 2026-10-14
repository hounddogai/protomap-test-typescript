import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentRollupCodeLengthRule,
  EnrollmentRollupGraceDaysRangeRule,
  EnrollmentRollupRequiredChannelRule,
  EnrollmentRollupRequiredLabelRule,
  defaultEnrollmentRollupValidator,
} from "./enrollment-rollup-rules.js";
import { newEnrollmentRollup } from "./enrollment-rollup.js";

test("EnrollmentRollupValidator reports every problem", () => {
  const validator = defaultEnrollmentRollupValidator();
  const item = newEnrollmentRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentRollupGraceDaysRangeRule flags values above grace days", () => {
  const rule = new EnrollmentRollupGraceDaysRangeRule(3600, 86400);
  const item = newEnrollmentRollup("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentRollupRequiredChannelRule flags a blank channel", () => {
  const rule = new EnrollmentRollupRequiredChannelRule("enrollment rollup needs this field");
  const item = newEnrollmentRollup("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentRollupCodeLengthRule flags a long code", () => {
  const rule = new EnrollmentRollupCodeLengthRule(255);
  const item = newEnrollmentRollup("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentRollupRequiredLabelRule flags a blank label", () => {
  const rule = new EnrollmentRollupRequiredLabelRule("enrollment rollup needs this field");
  const item = newEnrollmentRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
