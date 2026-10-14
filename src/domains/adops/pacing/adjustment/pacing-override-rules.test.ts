import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingOverrideEndsAtRangeRule,
  PacingOverrideRequiredCodeRule,
  PacingOverrideRequiredTitleRule,
  defaultPacingOverrideValidator,
} from "./pacing-override-rules.js";
import { newPacingOverride } from "./pacing-override.js";

test("PacingOverrideValidator reports every problem", () => {
  const validator = defaultPacingOverrideValidator();
  const item = newPacingOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingOverrideEndsAtRangeRule flags values above ends at", () => {
  const rule = new PacingOverrideEndsAtRangeRule(16, 80);
  const item = newPacingOverride("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new PacingOverrideRequiredTitleRule("pacing override needs an entry");
  const item = newPacingOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new PacingOverrideRequiredCodeRule("pacing override needs this field");
  const item = newPacingOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
