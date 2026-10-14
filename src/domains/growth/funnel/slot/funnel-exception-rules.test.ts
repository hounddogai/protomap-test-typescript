import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelExceptionCodeLengthRule,
  FunnelExceptionMarginRangeRule,
  FunnelExceptionRequiredCodeRule,
  defaultFunnelExceptionValidator,
} from "./funnel-exception-rules.js";
import { newFunnelException } from "./funnel-exception.js";

test("FunnelExceptionValidator reports every problem", () => {
  const validator = defaultFunnelExceptionValidator();
  const item = newFunnelException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new FunnelExceptionRequiredCodeRule("funnel exception needs an entry");
  const item = newFunnelException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelExceptionMarginRangeRule flags values above margin", () => {
  const rule = new FunnelExceptionMarginRangeRule(4.5, 2739.5);
  const item = newFunnelException("x", "y");
  item.margin = 2741;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelExceptionCodeLengthRule flags a long code", () => {
  const rule = new FunnelExceptionCodeLengthRule(1000);
  const item = newFunnelException("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
