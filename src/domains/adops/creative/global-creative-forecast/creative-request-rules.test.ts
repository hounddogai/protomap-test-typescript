import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeRequestCodeLengthRule,
  CreativeRequestLocaleLengthRule,
  CreativeRequestRequiredNameRule,
  defaultCreativeRequestValidator,
} from "./creative-request-rules.js";
import { newCreativeRequest } from "./creative-request.js";

test("CreativeRequestValidator reports every problem", () => {
  const validator = defaultCreativeRequestValidator();
  const item = newCreativeRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeRequestRequiredNameRule flags a blank name", () => {
  const rule = new CreativeRequestRequiredNameRule("creative request needs a value");
  const item = newCreativeRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeRequestLocaleLengthRule flags a long locale", () => {
  const rule = new CreativeRequestLocaleLengthRule(64);
  const item = newCreativeRequest("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeRequestCodeLengthRule flags a long code", () => {
  const rule = new CreativeRequestCodeLengthRule(64);
  const item = newCreativeRequest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
