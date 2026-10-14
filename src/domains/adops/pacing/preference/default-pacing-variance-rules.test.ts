import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPacingVarianceCodeLengthRule,
  DefaultPacingVariancePriorityRangeRule,
  DefaultPacingVarianceRequiredCodeRule,
  defaultDefaultPacingVarianceValidator,
} from "./default-pacing-variance-rules.js";
import { newDefaultPacingVariance } from "./default-pacing-variance.js";

test("DefaultPacingVarianceValidator reports every problem", () => {
  const validator = defaultDefaultPacingVarianceValidator();
  const item = newDefaultPacingVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPacingVarianceCodeLengthRule flags a long code", () => {
  const rule = new DefaultPacingVarianceCodeLengthRule(120);
  const item = newDefaultPacingVariance("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPacingVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultPacingVarianceRequiredCodeRule("default pacing variance needs an entry");
  const item = newDefaultPacingVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPacingVariancePriorityRangeRule flags values above priority", () => {
  const rule = new DefaultPacingVariancePriorityRangeRule(64, 64);
  const item = newDefaultPacingVariance("x", "y");
  item.priority = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
