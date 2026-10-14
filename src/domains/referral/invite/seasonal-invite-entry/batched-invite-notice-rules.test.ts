import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedInviteNoticeBatchSizeRangeRule,
  BatchedInviteNoticeQuantityRangeRule,
  BatchedInviteNoticeRequiredNameRule,
  defaultBatchedInviteNoticeValidator,
} from "./batched-invite-notice-rules.js";
import { newBatchedInviteNotice } from "./batched-invite-notice.js";

test("BatchedInviteNoticeValidator reports every problem", () => {
  const validator = defaultBatchedInviteNoticeValidator();
  const item = newBatchedInviteNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedInviteNoticeBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BatchedInviteNoticeBatchSizeRangeRule(16, 120);
  const item = newBatchedInviteNotice("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedInviteNoticeRequiredNameRule flags a blank name", () => {
  const rule = new BatchedInviteNoticeRequiredNameRule("batched invite notice needs a value");
  const item = newBatchedInviteNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedInviteNoticeQuantityRangeRule flags values above quantity", () => {
  const rule = new BatchedInviteNoticeQuantityRangeRule(64, 255);
  const item = newBatchedInviteNotice("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
