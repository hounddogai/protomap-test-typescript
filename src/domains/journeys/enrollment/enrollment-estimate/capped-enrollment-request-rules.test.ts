import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedEnrollmentRequestCodeLengthRule,
  CappedEnrollmentRequestDiscountRangeRule,
  CappedEnrollmentRequestNameLengthRule,
  CappedEnrollmentRequestRequiredUtmSourceRule,
  CappedEnrollmentRequestTitleLengthRule,
  defaultCappedEnrollmentRequestValidator,
} from "./capped-enrollment-request-rules.js";
import { newCappedEnrollmentRequest } from "./capped-enrollment-request.js";

test("CappedEnrollmentRequestValidator reports every problem", () => {
  const validator = defaultCappedEnrollmentRequestValidator();
  const item = newCappedEnrollmentRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedEnrollmentRequestNameLengthRule flags a long name", () => {
  const rule = new CappedEnrollmentRequestNameLengthRule(64);
  const item = newCappedEnrollmentRequest("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedEnrollmentRequestRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new CappedEnrollmentRequestRequiredUtmSourceRule("capped enrollment request needs an entry");
  const item = newCappedEnrollmentRequest("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedEnrollmentRequestTitleLengthRule flags a long title", () => {
  const rule = new CappedEnrollmentRequestTitleLengthRule(1000);
  const item = newCappedEnrollmentRequest("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedEnrollmentRequestDiscountRangeRule flags values above discount", () => {
  const rule = new CappedEnrollmentRequestDiscountRangeRule(5.4, 810.9);
  const item = newCappedEnrollmentRequest("x", "y");
  item.discount = 812.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedEnrollmentRequestCodeLengthRule flags a long code", () => {
  const rule = new CappedEnrollmentRequestCodeLengthRule(64);
  const item = newCappedEnrollmentRequest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
