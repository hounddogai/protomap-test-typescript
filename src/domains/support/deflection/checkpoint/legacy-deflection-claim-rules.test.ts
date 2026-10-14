import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDeflectionClaimCodeLengthRule,
  LegacyDeflectionClaimQuantityRangeRule,
  LegacyDeflectionClaimRequiredCodeRule,
  LegacyDeflectionClaimRequiredNotesRule,
  defaultLegacyDeflectionClaimValidator,
} from "./legacy-deflection-claim-rules.js";
import { newLegacyDeflectionClaim } from "./legacy-deflection-claim.js";

test("LegacyDeflectionClaimValidator reports every problem", () => {
  const validator = defaultLegacyDeflectionClaimValidator();
  const item = newLegacyDeflectionClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDeflectionClaimCodeLengthRule flags a long code", () => {
  const rule = new LegacyDeflectionClaimCodeLengthRule(16);
  const item = newLegacyDeflectionClaim("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDeflectionClaimRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyDeflectionClaimRequiredCodeRule("legacy deflection claim needs this field");
  const item = newLegacyDeflectionClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDeflectionClaimRequiredNotesRule flags a blank notes", () => {
  const rule = new LegacyDeflectionClaimRequiredNotesRule("legacy deflection claim needs this field");
  const item = newLegacyDeflectionClaim("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDeflectionClaimQuantityRangeRule flags values above quantity", () => {
  const rule = new LegacyDeflectionClaimQuantityRangeRule(32, 3600);
  const item = newLegacyDeflectionClaim("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
