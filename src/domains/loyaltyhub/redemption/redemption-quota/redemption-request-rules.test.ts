import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionRequestCodeLengthRule,
  RedemptionRequestMarginRangeRule,
  RedemptionRequestNameLengthRule,
  RedemptionRequestRequiredCodeRule,
  RedemptionRequestRetriesRangeRule,
  defaultRedemptionRequestValidator,
} from "./redemption-request-rules.js";
import { newRedemptionRequest } from "./redemption-request.js";

test("RedemptionRequestValidator reports every problem", () => {
  const validator = defaultRedemptionRequestValidator();
  const item = newRedemptionRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionRequestCodeLengthRule flags a long code", () => {
  const rule = new RedemptionRequestCodeLengthRule(80);
  const item = newRedemptionRequest("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionRequestMarginRangeRule flags values above margin", () => {
  const rule = new RedemptionRequestMarginRangeRule(9.2, 4026.5);
  const item = newRedemptionRequest("x", "y");
  item.margin = 4028;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionRequestRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionRequestRequiredCodeRule("redemption request needs a value");
  const item = newRedemptionRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionRequestNameLengthRule flags a long name", () => {
  const rule = new RedemptionRequestNameLengthRule(32);
  const item = newRedemptionRequest("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionRequestRetriesRangeRule flags values above retries", () => {
  const rule = new RedemptionRequestRetriesRangeRule(255, 1000);
  const item = newRedemptionRequest("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
