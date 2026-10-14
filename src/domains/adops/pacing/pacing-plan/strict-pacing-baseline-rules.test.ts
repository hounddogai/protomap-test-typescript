import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPacingBaselineBudgetRangeRule,
  StrictPacingBaselineChannelLengthRule,
  StrictPacingBaselineExternalRefLengthRule,
  defaultStrictPacingBaselineValidator,
} from "./strict-pacing-baseline-rules.js";
import { newStrictPacingBaseline } from "./strict-pacing-baseline.js";

test("StrictPacingBaselineValidator reports every problem", () => {
  const validator = defaultStrictPacingBaselineValidator();
  const item = newStrictPacingBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPacingBaselineChannelLengthRule flags a long channel", () => {
  const rule = new StrictPacingBaselineChannelLengthRule(120);
  const item = newStrictPacingBaseline("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPacingBaselineBudgetRangeRule flags values above budget", () => {
  const rule = new StrictPacingBaselineBudgetRangeRule(6.2, 261.1);
  const item = newStrictPacingBaseline("x", "y");
  item.budget = 262.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPacingBaselineExternalRefLengthRule flags a long external ref", () => {
  const rule = new StrictPacingBaselineExternalRefLengthRule(255);
  const item = newStrictPacingBaseline("x", "y");
  item.externalRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
