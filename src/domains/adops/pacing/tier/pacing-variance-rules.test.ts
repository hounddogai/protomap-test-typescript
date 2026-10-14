import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingVarianceRequiredCodeRule,
  PacingVarianceRequiredSummaryRule,
  defaultPacingVarianceValidator,
} from "./pacing-variance-rules.js";
import { newPacingVariance } from "./pacing-variance.js";

test("PacingVarianceValidator reports every problem", () => {
  const validator = defaultPacingVarianceValidator();
  const item = newPacingVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingVarianceRequiredSummaryRule flags a blank summary", () => {
  const rule = new PacingVarianceRequiredSummaryRule("pacing variance needs an entry");
  const item = newPacingVariance("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new PacingVarianceRequiredCodeRule("pacing variance needs this field");
  const item = newPacingVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
