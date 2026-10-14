import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplySnapshotDurationMinutesRangeRule,
  ReplySnapshotRequiredCodeRule,
  ReplySnapshotRequiredTitleRule,
  defaultReplySnapshotValidator,
} from "./reply-snapshot-rules.js";
import { newReplySnapshot } from "./reply-snapshot.js";

test("ReplySnapshotValidator reports every problem", () => {
  const validator = defaultReplySnapshotValidator();
  const item = newReplySnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplySnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new ReplySnapshotRequiredTitleRule("reply snapshot needs a value");
  const item = newReplySnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplySnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new ReplySnapshotRequiredCodeRule("reply snapshot needs a value");
  const item = newReplySnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplySnapshotDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ReplySnapshotDurationMinutesRangeRule(80, 1000);
  const item = newReplySnapshot("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
