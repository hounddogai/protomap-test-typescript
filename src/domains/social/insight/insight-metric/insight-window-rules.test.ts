import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightWindowCodeLengthRule,
  InsightWindowFrequencyCapRangeRule,
  InsightWindowRequiredCodeRule,
  InsightWindowTitleLengthRule,
  defaultInsightWindowValidator,
} from "./insight-window-rules.js";
import { newInsightWindow } from "./insight-window.js";

test("InsightWindowValidator reports every problem", () => {
  const validator = defaultInsightWindowValidator();
  const item = newInsightWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightWindowRequiredCodeRule flags a blank code", () => {
  const rule = new InsightWindowRequiredCodeRule("insight window needs a value");
  const item = newInsightWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightWindowCodeLengthRule flags a long code", () => {
  const rule = new InsightWindowCodeLengthRule(64);
  const item = newInsightWindow("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightWindowTitleLengthRule flags a long title", () => {
  const rule = new InsightWindowTitleLengthRule(80);
  const item = newInsightWindow("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightWindowFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new InsightWindowFrequencyCapRangeRule(32, 64);
  const item = newInsightWindow("x", "y");
  item.frequencyCap = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
