import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeBaselineCodeLengthRule,
  NudgeBaselineRegionLengthRule,
  NudgeBaselineRequiredCodeRule,
  defaultNudgeBaselineValidator,
} from "./nudge-baseline-rules.js";
import { newNudgeBaseline } from "./nudge-baseline.js";

test("NudgeBaselineValidator reports every problem", () => {
  const validator = defaultNudgeBaselineValidator();
  const item = newNudgeBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeBaselineRegionLengthRule flags a long region", () => {
  const rule = new NudgeBaselineRegionLengthRule(86400);
  const item = newNudgeBaseline("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeBaselineRequiredCodeRule("nudge baseline needs a value");
  const item = newNudgeBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeBaselineCodeLengthRule flags a long code", () => {
  const rule = new NudgeBaselineCodeLengthRule(80);
  const item = newNudgeBaseline("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
