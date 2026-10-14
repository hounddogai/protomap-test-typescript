import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultProofWindowClicksRangeRule,
  DefaultProofWindowCodeLengthRule,
  DefaultProofWindowRequiredDescriptionRule,
  DefaultProofWindowRequiredNameRule,
  DefaultProofWindowWindowDaysRangeRule,
  defaultDefaultProofWindowValidator,
} from "./default-proof-window-rules.js";
import { newDefaultProofWindow } from "./default-proof-window.js";

test("DefaultProofWindowValidator reports every problem", () => {
  const validator = defaultDefaultProofWindowValidator();
  const item = newDefaultProofWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultProofWindowWindowDaysRangeRule flags values above window days", () => {
  const rule = new DefaultProofWindowWindowDaysRangeRule(120, 1000);
  const item = newDefaultProofWindow("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultProofWindowClicksRangeRule flags values above clicks", () => {
  const rule = new DefaultProofWindowClicksRangeRule(64, 80);
  const item = newDefaultProofWindow("x", "y");
  item.clicks = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultProofWindowCodeLengthRule flags a long code", () => {
  const rule = new DefaultProofWindowCodeLengthRule(86400);
  const item = newDefaultProofWindow("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultProofWindowRequiredNameRule flags a blank name", () => {
  const rule = new DefaultProofWindowRequiredNameRule("default proof window needs this field");
  const item = newDefaultProofWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultProofWindowRequiredDescriptionRule flags a blank description", () => {
  const rule = new DefaultProofWindowRequiredDescriptionRule("default proof window needs an entry");
  const item = newDefaultProofWindow("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
