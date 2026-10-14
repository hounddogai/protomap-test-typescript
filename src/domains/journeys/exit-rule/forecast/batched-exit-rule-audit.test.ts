import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedExitRuleAudit } from "./batched-exit-rule-audit.js";

test("BatchedExitRuleAudit starts in draft", () => {
  const item = newBatchedExitRuleAudit("code-524", "title-619");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedExitRuleAudit moves to pending", () => {
  const item = newBatchedExitRuleAudit("code-524", "title-619");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BatchedExitRuleAudit rejects moves from closed", () => {
  const item = newBatchedExitRuleAudit("code-524", "title-619");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
