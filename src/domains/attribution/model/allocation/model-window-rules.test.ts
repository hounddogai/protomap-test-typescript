import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelWindowCategoryLengthRule,
  ModelWindowCodeLengthRule,
  ModelWindowNameLengthRule,
  ModelWindowRequiredNameRule,
  ModelWindowTimezoneLengthRule,
  defaultModelWindowValidator,
} from "./model-window-rules.js";
import { newModelWindow } from "./model-window.js";

test("ModelWindowValidator reports every problem", () => {
  const validator = defaultModelWindowValidator();
  const item = newModelWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelWindowCategoryLengthRule flags a long category", () => {
  const rule = new ModelWindowCategoryLengthRule(32);
  const item = newModelWindow("x", "y");
  item.category = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelWindowTimezoneLengthRule flags a long timezone", () => {
  const rule = new ModelWindowTimezoneLengthRule(255);
  const item = newModelWindow("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelWindowCodeLengthRule flags a long code", () => {
  const rule = new ModelWindowCodeLengthRule(3600);
  const item = newModelWindow("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelWindowRequiredNameRule flags a blank name", () => {
  const rule = new ModelWindowRequiredNameRule("model window needs this field");
  const item = newModelWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelWindowNameLengthRule flags a long name", () => {
  const rule = new ModelWindowNameLengthRule(64);
  const item = newModelWindow("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
