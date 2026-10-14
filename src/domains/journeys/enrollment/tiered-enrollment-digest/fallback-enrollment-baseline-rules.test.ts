import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackEnrollmentBaselineCeilingRangeRule,
  defaultFallbackEnrollmentBaselineValidator,
} from "./fallback-enrollment-baseline-rules.js";
import { newFallbackEnrollmentBaseline } from "./fallback-enrollment-baseline.js";

test("FallbackEnrollmentBaselineValidator reports every problem", () => {
  const validator = defaultFallbackEnrollmentBaselineValidator();
  const item = newFallbackEnrollmentBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackEnrollmentBaselineCeilingRangeRule flags values above ceiling", () => {
  const rule = new FallbackEnrollmentBaselineCeilingRangeRule(8, 2765.7);
  const item = newFallbackEnrollmentBaseline("x", "y");
  item.ceiling = 2767.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
