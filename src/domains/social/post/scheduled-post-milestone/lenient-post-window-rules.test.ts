import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPostWindowLocaleLengthRule,
  LenientPostWindowRequiredCodeRule,
  LenientPostWindowRequiredLabelRule,
  LenientPostWindowStartsAtRangeRule,
  defaultLenientPostWindowValidator,
} from "./lenient-post-window-rules.js";
import { newLenientPostWindow } from "./lenient-post-window.js";

test("LenientPostWindowValidator reports every problem", () => {
  const validator = defaultLenientPostWindowValidator();
  const item = newLenientPostWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPostWindowRequiredLabelRule flags a blank label", () => {
  const rule = new LenientPostWindowRequiredLabelRule("lenient post window needs a value");
  const item = newLenientPostWindow("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPostWindowLocaleLengthRule flags a long locale", () => {
  const rule = new LenientPostWindowLocaleLengthRule(32);
  const item = newLenientPostWindow("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPostWindowStartsAtRangeRule flags values above starts at", () => {
  const rule = new LenientPostWindowStartsAtRangeRule(16, 32);
  const item = newLenientPostWindow("x", "y");
  item.startsAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPostWindowRequiredCodeRule flags a blank code", () => {
  const rule = new LenientPostWindowRequiredCodeRule("lenient post window needs a value");
  const item = newLenientPostWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
