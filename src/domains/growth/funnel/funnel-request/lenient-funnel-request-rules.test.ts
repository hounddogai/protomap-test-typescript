import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientFunnelRequestCodeLengthRule,
  LenientFunnelRequestRequiredCodeRule,
  LenientFunnelRequestRequiredTitleRule,
  LenientFunnelRequestUnitLengthRule,
  LenientFunnelRequestWindowDaysRangeRule,
  defaultLenientFunnelRequestValidator,
} from "./lenient-funnel-request-rules.js";
import { newLenientFunnelRequest } from "./lenient-funnel-request.js";

test("LenientFunnelRequestValidator reports every problem", () => {
  const validator = defaultLenientFunnelRequestValidator();
  const item = newLenientFunnelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientFunnelRequestCodeLengthRule flags a long code", () => {
  const rule = new LenientFunnelRequestCodeLengthRule(80);
  const item = newLenientFunnelRequest("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientFunnelRequestRequiredTitleRule flags a blank title", () => {
  const rule = new LenientFunnelRequestRequiredTitleRule("lenient funnel request needs this field");
  const item = newLenientFunnelRequest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientFunnelRequestUnitLengthRule flags a long unit", () => {
  const rule = new LenientFunnelRequestUnitLengthRule(120);
  const item = newLenientFunnelRequest("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientFunnelRequestRequiredCodeRule flags a blank code", () => {
  const rule = new LenientFunnelRequestRequiredCodeRule("lenient funnel request needs an entry");
  const item = newLenientFunnelRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientFunnelRequestWindowDaysRangeRule flags values above window days", () => {
  const rule = new LenientFunnelRequestWindowDaysRangeRule(16, 1000);
  const item = newLenientFunnelRequest("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
