import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationWindowCodeLengthRule,
  ReputationWindowRequiredCodeRule,
  ReputationWindowRequiredSummaryRule,
  ReputationWindowUtmSourceLengthRule,
  defaultReputationWindowValidator,
} from "./reputation-window-rules.js";
import { newReputationWindow } from "./reputation-window.js";

test("ReputationWindowValidator reports every problem", () => {
  const validator = defaultReputationWindowValidator();
  const item = newReputationWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationWindowCodeLengthRule flags a long code", () => {
  const rule = new ReputationWindowCodeLengthRule(16);
  const item = newReputationWindow("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationWindowUtmSourceLengthRule flags a long utm source", () => {
  const rule = new ReputationWindowUtmSourceLengthRule(86400);
  const item = newReputationWindow("x", "y");
  item.utmSource = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationWindowRequiredSummaryRule flags a blank summary", () => {
  const rule = new ReputationWindowRequiredSummaryRule("reputation window needs an entry");
  const item = newReputationWindow("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationWindowRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationWindowRequiredCodeRule("reputation window needs this field");
  const item = newReputationWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
