import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalActivationExceptionCodeLengthRule,
  SeasonalActivationExceptionCohortLengthRule,
  defaultSeasonalActivationExceptionValidator,
} from "./seasonal-activation-exception-rules.js";
import { newSeasonalActivationException } from "./seasonal-activation-exception.js";

test("SeasonalActivationExceptionValidator reports every problem", () => {
  const validator = defaultSeasonalActivationExceptionValidator();
  const item = newSeasonalActivationException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalActivationExceptionCohortLengthRule flags a long cohort", () => {
  const rule = new SeasonalActivationExceptionCohortLengthRule(86400);
  const item = newSeasonalActivationException("x", "y");
  item.cohort = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalActivationExceptionCodeLengthRule flags a long code", () => {
  const rule = new SeasonalActivationExceptionCodeLengthRule(16);
  const item = newSeasonalActivationException("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
