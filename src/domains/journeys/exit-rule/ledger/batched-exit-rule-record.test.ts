import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedExitRuleRecord } from "./batched-exit-rule-record.js";

test("BatchedExitRuleRecord starts in draft", () => {
  const item = newBatchedExitRuleRecord("code-58", "label-836");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedExitRuleRecord moves to pending", () => {
  const item = newBatchedExitRuleRecord("code-58", "label-836");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BatchedExitRuleRecord rejects moves from closed", () => {
  const item = newBatchedExitRuleRecord("code-58", "label-836");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
