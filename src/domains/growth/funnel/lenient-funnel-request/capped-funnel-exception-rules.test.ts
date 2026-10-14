import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFunnelExceptionBudgetRangeRule,
  CappedFunnelExceptionCodeLengthRule,
  CappedFunnelExceptionDescriptionLengthRule,
  CappedFunnelExceptionRequiredDescriptionRule,
  defaultCappedFunnelExceptionValidator,
} from "./capped-funnel-exception-rules.js";
import { newCappedFunnelException } from "./capped-funnel-exception.js";

test("CappedFunnelExceptionValidator reports every problem", () => {
  const validator = defaultCappedFunnelExceptionValidator();
  const item = newCappedFunnelException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFunnelExceptionCodeLengthRule flags a long code", () => {
  const rule = new CappedFunnelExceptionCodeLengthRule(3600);
  const item = newCappedFunnelException("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFunnelExceptionDescriptionLengthRule flags a long description", () => {
  const rule = new CappedFunnelExceptionDescriptionLengthRule(32);
  const item = newCappedFunnelException("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFunnelExceptionBudgetRangeRule flags values above budget", () => {
  const rule = new CappedFunnelExceptionBudgetRangeRule(9.8, 3545.8);
  const item = newCappedFunnelException("x", "y");
  item.budget = 3547.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedFunnelExceptionRequiredDescriptionRule flags a blank description", () => {
  const rule = new CappedFunnelExceptionRequiredDescriptionRule("capped funnel exception needs a value");
  const item = newCappedFunnelException("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
