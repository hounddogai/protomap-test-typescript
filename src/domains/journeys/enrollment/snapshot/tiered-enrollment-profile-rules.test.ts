import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredEnrollmentProfileCodeLengthRule,
  TieredEnrollmentProfileRequiredCodeRule,
  TieredEnrollmentProfileRequiredNotesRule,
  defaultTieredEnrollmentProfileValidator,
} from "./tiered-enrollment-profile-rules.js";
import { newTieredEnrollmentProfile } from "./tiered-enrollment-profile.js";

test("TieredEnrollmentProfileValidator reports every problem", () => {
  const validator = defaultTieredEnrollmentProfileValidator();
  const item = newTieredEnrollmentProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredEnrollmentProfileRequiredNotesRule flags a blank notes", () => {
  const rule = new TieredEnrollmentProfileRequiredNotesRule("tiered enrollment profile needs an entry");
  const item = newTieredEnrollmentProfile("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredEnrollmentProfileCodeLengthRule flags a long code", () => {
  const rule = new TieredEnrollmentProfileCodeLengthRule(255);
  const item = newTieredEnrollmentProfile("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredEnrollmentProfileRequiredCodeRule flags a blank code", () => {
  const rule = new TieredEnrollmentProfileRequiredCodeRule("tiered enrollment profile needs a value");
  const item = newTieredEnrollmentProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
