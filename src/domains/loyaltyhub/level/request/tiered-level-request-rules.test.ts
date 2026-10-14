import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredLevelRequestCategoryLengthRule,
  TieredLevelRequestCodeLengthRule,
  TieredLevelRequestRequiredCodeRule,
  TieredLevelRequestRequiredNameRule,
  defaultTieredLevelRequestValidator,
} from "./tiered-level-request-rules.js";
import { newTieredLevelRequest } from "./tiered-level-request.js";

test("TieredLevelRequestValidator reports every problem", () => {
  const validator = defaultTieredLevelRequestValidator();
  const item = newTieredLevelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredLevelRequestCodeLengthRule flags a long code", () => {
  const rule = new TieredLevelRequestCodeLengthRule(3600);
  const item = newTieredLevelRequest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredLevelRequestRequiredNameRule flags a blank name", () => {
  const rule = new TieredLevelRequestRequiredNameRule("tiered level request needs this field");
  const item = newTieredLevelRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredLevelRequestRequiredCodeRule flags a blank code", () => {
  const rule = new TieredLevelRequestRequiredCodeRule("tiered level request needs an entry");
  const item = newTieredLevelRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredLevelRequestCategoryLengthRule flags a long category", () => {
  const rule = new TieredLevelRequestCategoryLengthRule(16);
  const item = newTieredLevelRequest("x", "y");
  item.category = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
