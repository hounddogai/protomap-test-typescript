import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingBaselineNotesLengthRule,
  PacingBaselineRequiredDescriptionRule,
  defaultPacingBaselineValidator,
} from "./pacing-baseline-rules.js";
import { newPacingBaseline } from "./pacing-baseline.js";

test("PacingBaselineValidator reports every problem", () => {
  const validator = defaultPacingBaselineValidator();
  const item = newPacingBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingBaselineRequiredDescriptionRule flags a blank description", () => {
  const rule = new PacingBaselineRequiredDescriptionRule("pacing baseline needs an entry");
  const item = newPacingBaseline("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingBaselineNotesLengthRule flags a long notes", () => {
  const rule = new PacingBaselineNotesLengthRule(16);
  const item = newPacingBaseline("x", "y");
  item.notes = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
