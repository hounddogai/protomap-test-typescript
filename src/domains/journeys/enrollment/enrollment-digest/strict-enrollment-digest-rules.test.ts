import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictEnrollmentDigestRequiredCodeRule,
  StrictEnrollmentDigestUtmSourceLengthRule,
  defaultStrictEnrollmentDigestValidator,
} from "./strict-enrollment-digest-rules.js";
import { newStrictEnrollmentDigest } from "./strict-enrollment-digest.js";

test("StrictEnrollmentDigestValidator reports every problem", () => {
  const validator = defaultStrictEnrollmentDigestValidator();
  const item = newStrictEnrollmentDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictEnrollmentDigestUtmSourceLengthRule flags a long utm source", () => {
  const rule = new StrictEnrollmentDigestUtmSourceLengthRule(120);
  const item = newStrictEnrollmentDigest("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictEnrollmentDigestRequiredCodeRule flags a blank code", () => {
  const rule = new StrictEnrollmentDigestRequiredCodeRule("strict enrollment digest needs an entry");
  const item = newStrictEnrollmentDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
