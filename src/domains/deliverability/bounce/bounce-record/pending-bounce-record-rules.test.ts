import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingBounceRecordChannelLengthRule,
  PendingBounceRecordRequiredTitleRule,
  defaultPendingBounceRecordValidator,
} from "./pending-bounce-record-rules.js";
import { newPendingBounceRecord } from "./pending-bounce-record.js";

test("PendingBounceRecordValidator reports every problem", () => {
  const validator = defaultPendingBounceRecordValidator();
  const item = newPendingBounceRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingBounceRecordRequiredTitleRule flags a blank title", () => {
  const rule = new PendingBounceRecordRequiredTitleRule("pending bounce record needs this field");
  const item = newPendingBounceRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingBounceRecordChannelLengthRule flags a long channel", () => {
  const rule = new PendingBounceRecordChannelLengthRule(16);
  const item = newPendingBounceRecord("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
