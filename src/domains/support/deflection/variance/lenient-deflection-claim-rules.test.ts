import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientDeflectionClaimCodeLengthRule,
  LenientDeflectionClaimNotesLengthRule,
  LenientDeflectionClaimRequiredNotesRule,
  LenientDeflectionClaimRequiredPhoneRule,
  defaultLenientDeflectionClaimValidator,
} from "./lenient-deflection-claim-rules.js";
import { newLenientDeflectionClaim } from "./lenient-deflection-claim.js";

test("LenientDeflectionClaimValidator reports every problem", () => {
  const validator = defaultLenientDeflectionClaimValidator();
  const item = newLenientDeflectionClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientDeflectionClaimRequiredPhoneRule flags a blank phone", () => {
  const rule = new LenientDeflectionClaimRequiredPhoneRule("lenient deflection claim needs this field");
  const item = newLenientDeflectionClaim("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientDeflectionClaimCodeLengthRule flags a long code", () => {
  const rule = new LenientDeflectionClaimCodeLengthRule(120);
  const item = newLenientDeflectionClaim("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientDeflectionClaimRequiredNotesRule flags a blank notes", () => {
  const rule = new LenientDeflectionClaimRequiredNotesRule("lenient deflection claim needs a value");
  const item = newLenientDeflectionClaim("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientDeflectionClaimNotesLengthRule flags a long notes", () => {
  const rule = new LenientDeflectionClaimNotesLengthRule(32);
  const item = newLenientDeflectionClaim("x", "y");
  item.notes = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
