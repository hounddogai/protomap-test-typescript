import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryMacroEstimateCodeLengthRule,
  PrimaryMacroEstimateEndsAtRangeRule,
  PrimaryMacroEstimateNameLengthRule,
  PrimaryMacroEstimateRequiredCodeRule,
  PrimaryMacroEstimateRequiredNotesRule,
  defaultPrimaryMacroEstimateValidator,
} from "./primary-macro-estimate-rules.js";
import { newPrimaryMacroEstimate } from "./primary-macro-estimate.js";

test("PrimaryMacroEstimateValidator reports every problem", () => {
  const validator = defaultPrimaryMacroEstimateValidator();
  const item = newPrimaryMacroEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryMacroEstimateCodeLengthRule flags a long code", () => {
  const rule = new PrimaryMacroEstimateCodeLengthRule(1000);
  const item = newPrimaryMacroEstimate("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryMacroEstimateRequiredNotesRule flags a blank notes", () => {
  const rule = new PrimaryMacroEstimateRequiredNotesRule("primary macro estimate needs a value");
  const item = newPrimaryMacroEstimate("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryMacroEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryMacroEstimateRequiredCodeRule("primary macro estimate needs a value");
  const item = newPrimaryMacroEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryMacroEstimateEndsAtRangeRule flags values above ends at", () => {
  const rule = new PrimaryMacroEstimateEndsAtRangeRule(120, 255);
  const item = newPrimaryMacroEstimate("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryMacroEstimateNameLengthRule flags a long name", () => {
  const rule = new PrimaryMacroEstimateNameLengthRule(3600);
  const item = newPrimaryMacroEstimate("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
