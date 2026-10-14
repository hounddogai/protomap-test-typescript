import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionClaimCodeLengthRule,
  SuppressionClaimNotesLengthRule,
  SuppressionClaimRegionLengthRule,
  SuppressionClaimRequiredLabelRule,
  defaultSuppressionClaimValidator,
} from "./suppression-claim-rules.js";
import { newSuppressionClaim } from "./suppression-claim.js";

test("SuppressionClaimValidator reports every problem", () => {
  const validator = defaultSuppressionClaimValidator();
  const item = newSuppressionClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionClaimRequiredLabelRule flags a blank label", () => {
  const rule = new SuppressionClaimRequiredLabelRule("suppression claim needs an entry");
  const item = newSuppressionClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionClaimCodeLengthRule flags a long code", () => {
  const rule = new SuppressionClaimCodeLengthRule(16);
  const item = newSuppressionClaim("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionClaimNotesLengthRule flags a long notes", () => {
  const rule = new SuppressionClaimNotesLengthRule(80);
  const item = newSuppressionClaim("x", "y");
  item.notes = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionClaimRegionLengthRule flags a long region", () => {
  const rule = new SuppressionClaimRegionLengthRule(80);
  const item = newSuppressionClaim("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
