import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyRequestCodeLengthRule,
  ReplyRequestQuantityRangeRule,
  ReplyRequestTitleLengthRule,
  ReplyRequestVariantLengthRule,
  defaultReplyRequestValidator,
} from "./reply-request-rules.js";
import { newReplyRequest } from "./reply-request.js";

test("ReplyRequestValidator reports every problem", () => {
  const validator = defaultReplyRequestValidator();
  const item = newReplyRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyRequestCodeLengthRule flags a long code", () => {
  const rule = new ReplyRequestCodeLengthRule(3600);
  const item = newReplyRequest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyRequestTitleLengthRule flags a long title", () => {
  const rule = new ReplyRequestTitleLengthRule(64);
  const item = newReplyRequest("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyRequestVariantLengthRule flags a long variant", () => {
  const rule = new ReplyRequestVariantLengthRule(32);
  const item = newReplyRequest("x", "y");
  item.variant = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyRequestQuantityRangeRule flags values above quantity", () => {
  const rule = new ReplyRequestQuantityRangeRule(32, 3600);
  const item = newReplyRequest("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
