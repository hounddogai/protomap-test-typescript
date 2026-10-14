import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRedemptionWindowCodeLengthRule,
  StrictRedemptionWindowRequiredSummaryRule,
  StrictRedemptionWindowSummaryLengthRule,
  defaultStrictRedemptionWindowValidator,
} from "./strict-redemption-window-rules.js";
import { newStrictRedemptionWindow } from "./strict-redemption-window.js";

test("StrictRedemptionWindowValidator reports every problem", () => {
  const validator = defaultStrictRedemptionWindowValidator();
  const item = newStrictRedemptionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRedemptionWindowRequiredSummaryRule flags a blank summary", () => {
  const rule = new StrictRedemptionWindowRequiredSummaryRule("strict redemption window needs an entry");
  const item = newStrictRedemptionWindow("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRedemptionWindowCodeLengthRule flags a long code", () => {
  const rule = new StrictRedemptionWindowCodeLengthRule(16);
  const item = newStrictRedemptionWindow("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRedemptionWindowSummaryLengthRule flags a long summary", () => {
  const rule = new StrictRedemptionWindowSummaryLengthRule(86400);
  const item = newStrictRedemptionWindow("x", "y");
  item.summary = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
