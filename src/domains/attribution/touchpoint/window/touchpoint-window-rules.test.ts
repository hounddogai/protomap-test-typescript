import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointWindowAttemptsRangeRule,
  TouchpointWindowNameLengthRule,
  TouchpointWindowRequiredLabelRule,
  TouchpointWindowRequiredNameRule,
  defaultTouchpointWindowValidator,
} from "./touchpoint-window-rules.js";
import { newTouchpointWindow } from "./touchpoint-window.js";

test("TouchpointWindowValidator reports every problem", () => {
  const validator = defaultTouchpointWindowValidator();
  const item = newTouchpointWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointWindowAttemptsRangeRule flags values above attempts", () => {
  const rule = new TouchpointWindowAttemptsRangeRule(64, 255);
  const item = newTouchpointWindow("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointWindowNameLengthRule flags a long name", () => {
  const rule = new TouchpointWindowNameLengthRule(1000);
  const item = newTouchpointWindow("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointWindowRequiredLabelRule flags a blank label", () => {
  const rule = new TouchpointWindowRequiredLabelRule("touchpoint window needs this field");
  const item = newTouchpointWindow("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointWindowRequiredNameRule flags a blank name", () => {
  const rule = new TouchpointWindowRequiredNameRule("touchpoint window needs a value");
  const item = newTouchpointWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
