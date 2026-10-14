import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderBaselineCeilingRangeRule,
  SenderBaselineCountryLengthRule,
  SenderBaselineRequiredCountryRule,
  SenderBaselineTitleLengthRule,
  defaultSenderBaselineValidator,
} from "./sender-baseline-rules.js";
import { newSenderBaseline } from "./sender-baseline.js";

test("SenderBaselineValidator reports every problem", () => {
  const validator = defaultSenderBaselineValidator();
  const item = newSenderBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderBaselineCountryLengthRule flags a long country", () => {
  const rule = new SenderBaselineCountryLengthRule(3600);
  const item = newSenderBaseline("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderBaselineCeilingRangeRule flags values above ceiling", () => {
  const rule = new SenderBaselineCeilingRangeRule(6.6, 4186.9);
  const item = newSenderBaseline("x", "y");
  item.ceiling = 4188.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderBaselineTitleLengthRule flags a long title", () => {
  const rule = new SenderBaselineTitleLengthRule(32);
  const item = newSenderBaseline("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderBaselineRequiredCountryRule flags a blank country", () => {
  const rule = new SenderBaselineRequiredCountryRule("sender baseline needs this field");
  const item = newSenderBaseline("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
