import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedQueueAgreement } from "./batched-queue-agreement.js";

test("BatchedQueueAgreement starts in draft", () => {
  const item = newBatchedQueueAgreement("code-666", "name-478");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedQueueAgreement moves to active", () => {
  const item = newBatchedQueueAgreement("code-666", "name-478");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BatchedQueueAgreement rejects moves from closed", () => {
  const item = newBatchedQueueAgreement("code-666", "name-478");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
