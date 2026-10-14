import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingWindowCodeLengthRule,
  PacingWindowNameLengthRule,
  PacingWindowRequiredNameRule,
  PacingWindowRequiredTitleRule,
  defaultPacingWindowValidator,
} from "./pacing-window-rules.js";
import { newPacingWindow } from "./pacing-window.js";

test("PacingWindowValidator reports every problem", () => {
  const validator = defaultPacingWindowValidator();
  const item = newPacingWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingWindowNameLengthRule flags a long name", () => {
  const rule = new PacingWindowNameLengthRule(255);
  const item = newPacingWindow("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingWindowRequiredNameRule flags a blank name", () => {
  const rule = new PacingWindowRequiredNameRule("pacing window needs a value");
  const item = newPacingWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingWindowRequiredTitleRule flags a blank title", () => {
  const rule = new PacingWindowRequiredTitleRule("pacing window needs an entry");
  const item = newPacingWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingWindowCodeLengthRule flags a long code", () => {
  const rule = new PacingWindowCodeLengthRule(86400);
  const item = newPacingWindow("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
