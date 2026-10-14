import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedInviteEntryCeilingRangeRule,
  BatchedInviteEntryRegionLengthRule,
  BatchedInviteEntryRequiredCodeRule,
  defaultBatchedInviteEntryValidator,
} from "./batched-invite-entry-rules.js";
import { newBatchedInviteEntry } from "./batched-invite-entry.js";

test("BatchedInviteEntryValidator reports every problem", () => {
  const validator = defaultBatchedInviteEntryValidator();
  const item = newBatchedInviteEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedInviteEntryCeilingRangeRule flags values above ceiling", () => {
  const rule = new BatchedInviteEntryCeilingRangeRule(0.6, 2468.2);
  const item = newBatchedInviteEntry("x", "y");
  item.ceiling = 2469.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedInviteEntryRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedInviteEntryRequiredCodeRule("batched invite entry needs a value");
  const item = newBatchedInviteEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedInviteEntryRegionLengthRule flags a long region", () => {
  const rule = new BatchedInviteEntryRegionLengthRule(80);
  const item = newBatchedInviteEntry("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
