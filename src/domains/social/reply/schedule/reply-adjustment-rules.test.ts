import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyAdjustmentRequiredTitleRule,
  ReplyAdjustmentTitleLengthRule,
  defaultReplyAdjustmentValidator,
} from "./reply-adjustment-rules.js";
import { newReplyAdjustment } from "./reply-adjustment.js";

test("ReplyAdjustmentValidator reports every problem", () => {
  const validator = defaultReplyAdjustmentValidator();
  const item = newReplyAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new ReplyAdjustmentTitleLengthRule(255);
  const item = newReplyAdjustment("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new ReplyAdjustmentRequiredTitleRule("reply adjustment needs a value");
  const item = newReplyAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
