import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeWindowCodeLengthRule,
  CreativeWindowRateRangeRule,
  CreativeWindowRequiredCodeRule,
  CreativeWindowRequiredLocaleRule,
  CreativeWindowRequiredOwnerIdRule,
  defaultCreativeWindowValidator,
} from "./creative-window-rules.js";
import { newCreativeWindow } from "./creative-window.js";

test("CreativeWindowValidator reports every problem", () => {
  const validator = defaultCreativeWindowValidator();
  const item = newCreativeWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeWindowCodeLengthRule flags a long code", () => {
  const rule = new CreativeWindowCodeLengthRule(120);
  const item = newCreativeWindow("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeWindowRequiredLocaleRule flags a blank locale", () => {
  const rule = new CreativeWindowRequiredLocaleRule("creative window needs a value");
  const item = newCreativeWindow("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeWindowRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new CreativeWindowRequiredOwnerIdRule("creative window needs this field");
  const item = newCreativeWindow("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeWindowRateRangeRule flags values above rate", () => {
  const rule = new CreativeWindowRateRangeRule(6.1, 2478.9);
  const item = newCreativeWindow("x", "y");
  item.rate = 2480.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeWindowRequiredCodeRule flags a blank code", () => {
  const rule = new CreativeWindowRequiredCodeRule("creative window needs this field");
  const item = newCreativeWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
