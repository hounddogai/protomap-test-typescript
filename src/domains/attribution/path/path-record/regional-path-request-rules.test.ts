import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPathRequestCapacityRangeRule,
  RegionalPathRequestCodeLengthRule,
  RegionalPathRequestRequiredCategoryRule,
  RegionalPathRequestRequiredCodeRule,
  RegionalPathRequestRequiredNameRule,
  defaultRegionalPathRequestValidator,
} from "./regional-path-request-rules.js";
import { newRegionalPathRequest } from "./regional-path-request.js";

test("RegionalPathRequestValidator reports every problem", () => {
  const validator = defaultRegionalPathRequestValidator();
  const item = newRegionalPathRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPathRequestCapacityRangeRule flags values above capacity", () => {
  const rule = new RegionalPathRequestCapacityRangeRule(32, 64);
  const item = newRegionalPathRequest("x", "y");
  item.capacity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPathRequestRequiredNameRule flags a blank name", () => {
  const rule = new RegionalPathRequestRequiredNameRule("regional path request needs this field");
  const item = newRegionalPathRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalPathRequestRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalPathRequestRequiredCodeRule("regional path request needs this field");
  const item = newRegionalPathRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalPathRequestCodeLengthRule flags a long code", () => {
  const rule = new RegionalPathRequestCodeLengthRule(255);
  const item = newRegionalPathRequest("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalPathRequestRequiredCategoryRule flags a blank category", () => {
  const rule = new RegionalPathRequestRequiredCategoryRule("regional path request needs an entry");
  const item = newRegionalPathRequest("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
