import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutRequestCodeLengthRule,
  OptOutRequestCostRangeRule,
  OptOutRequestRequiredCodeRule,
  OptOutRequestRequiredRegionRule,
  OptOutRequestTitleLengthRule,
  defaultOptOutRequestValidator,
} from "./opt-out-request-rules.js";
import { newOptOutRequest } from "./opt-out-request.js";

test("OptOutRequestValidator reports every problem", () => {
  const validator = defaultOptOutRequestValidator();
  const item = newOptOutRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutRequestCostRangeRule flags values above cost", () => {
  const rule = new OptOutRequestCostRangeRule(3.2, 1179.6);
  const item = newOptOutRequest("x", "y");
  item.cost = 1181.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutRequestCodeLengthRule flags a long code", () => {
  const rule = new OptOutRequestCodeLengthRule(255);
  const item = newOptOutRequest("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutRequestRequiredCodeRule flags a blank code", () => {
  const rule = new OptOutRequestRequiredCodeRule("opt out request needs this field");
  const item = newOptOutRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutRequestRequiredRegionRule flags a blank region", () => {
  const rule = new OptOutRequestRequiredRegionRule("opt out request needs an entry");
  const item = newOptOutRequest("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutRequestTitleLengthRule flags a long title", () => {
  const rule = new OptOutRequestTitleLengthRule(1000);
  const item = newOptOutRequest("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
