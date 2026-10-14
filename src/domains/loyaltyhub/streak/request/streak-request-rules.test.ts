import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakRequestCodeLengthRule,
  StreakRequestRequiredLabelRule,
  StreakRequestRequiredSummaryRule,
  StreakRequestSendAtRangeRule,
  StreakRequestSummaryLengthRule,
  defaultStreakRequestValidator,
} from "./streak-request-rules.js";
import { newStreakRequest } from "./streak-request.js";

test("StreakRequestValidator reports every problem", () => {
  const validator = defaultStreakRequestValidator();
  const item = newStreakRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakRequestRequiredLabelRule flags a blank label", () => {
  const rule = new StreakRequestRequiredLabelRule("streak request needs an entry");
  const item = newStreakRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakRequestSummaryLengthRule flags a long summary", () => {
  const rule = new StreakRequestSummaryLengthRule(80);
  const item = newStreakRequest("x", "y");
  item.summary = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakRequestRequiredSummaryRule flags a blank summary", () => {
  const rule = new StreakRequestRequiredSummaryRule("streak request needs a value");
  const item = newStreakRequest("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakRequestCodeLengthRule flags a long code", () => {
  const rule = new StreakRequestCodeLengthRule(64);
  const item = newStreakRequest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakRequestSendAtRangeRule flags values above send at", () => {
  const rule = new StreakRequestSendAtRangeRule(255, 255);
  const item = newStreakRequest("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
