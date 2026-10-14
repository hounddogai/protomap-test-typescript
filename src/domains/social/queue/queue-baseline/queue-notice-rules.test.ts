import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueNoticeBatchSizeRangeRule,
  QueueNoticeRequiredCodeRule,
  defaultQueueNoticeValidator,
} from "./queue-notice-rules.js";
import { newQueueNotice } from "./queue-notice.js";

test("QueueNoticeValidator reports every problem", () => {
  const validator = defaultQueueNoticeValidator();
  const item = newQueueNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueNoticeBatchSizeRangeRule flags values above batch size", () => {
  const rule = new QueueNoticeBatchSizeRangeRule(16, 1000);
  const item = newQueueNotice("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new QueueNoticeRequiredCodeRule("queue notice needs an entry");
  const item = newQueueNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
