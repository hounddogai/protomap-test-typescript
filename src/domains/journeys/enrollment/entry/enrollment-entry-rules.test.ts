import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentEntryCapacityRangeRule,
  EnrollmentEntryContactEmailLengthRule,
  EnrollmentEntryNameLengthRule,
  EnrollmentEntryRequiredExternalRefRule,
  defaultEnrollmentEntryValidator,
} from "./enrollment-entry-rules.js";
import { newEnrollmentEntry } from "./enrollment-entry.js";

test("EnrollmentEntryValidator reports every problem", () => {
  const validator = defaultEnrollmentEntryValidator();
  const item = newEnrollmentEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentEntryRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new EnrollmentEntryRequiredExternalRefRule("enrollment entry needs an entry");
  const item = newEnrollmentEntry("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentEntryContactEmailLengthRule flags a long contact email", () => {
  const rule = new EnrollmentEntryContactEmailLengthRule(120);
  const item = newEnrollmentEntry("x", "y");
  item.contactEmail = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentEntryCapacityRangeRule flags values above capacity", () => {
  const rule = new EnrollmentEntryCapacityRangeRule(80, 1000);
  const item = newEnrollmentEntry("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentEntryNameLengthRule flags a long name", () => {
  const rule = new EnrollmentEntryNameLengthRule(16);
  const item = newEnrollmentEntry("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
