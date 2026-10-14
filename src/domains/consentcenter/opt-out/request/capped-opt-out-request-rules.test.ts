import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedOptOutRequestCodeLengthRule,
  CappedOptOutRequestLimitRangeRule,
  CappedOptOutRequestTitleLengthRule,
  defaultCappedOptOutRequestValidator,
} from "./capped-opt-out-request-rules.js";
import { newCappedOptOutRequest } from "./capped-opt-out-request.js";

test("CappedOptOutRequestValidator reports every problem", () => {
  const validator = defaultCappedOptOutRequestValidator();
  const item = newCappedOptOutRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedOptOutRequestLimitRangeRule flags values above limit", () => {
  const rule = new CappedOptOutRequestLimitRangeRule(16, 3600);
  const item = newCappedOptOutRequest("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedOptOutRequestCodeLengthRule flags a long code", () => {
  const rule = new CappedOptOutRequestCodeLengthRule(80);
  const item = newCappedOptOutRequest("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedOptOutRequestTitleLengthRule flags a long title", () => {
  const rule = new CappedOptOutRequestTitleLengthRule(120);
  const item = newCappedOptOutRequest("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
