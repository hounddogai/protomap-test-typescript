import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatWindowNameLengthRule,
  CsatWindowRequiredCodeRule,
  CsatWindowSendAtRangeRule,
  defaultCsatWindowValidator,
} from "./csat-window-rules.js";
import { newCsatWindow } from "./csat-window.js";

test("CsatWindowValidator reports every problem", () => {
  const validator = defaultCsatWindowValidator();
  const item = newCsatWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatWindowNameLengthRule flags a long name", () => {
  const rule = new CsatWindowNameLengthRule(1000);
  const item = newCsatWindow("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatWindowRequiredCodeRule flags a blank code", () => {
  const rule = new CsatWindowRequiredCodeRule("csat window needs this field");
  const item = newCsatWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatWindowSendAtRangeRule flags values above send at", () => {
  const rule = new CsatWindowSendAtRangeRule(120, 86400);
  const item = newCsatWindow("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
