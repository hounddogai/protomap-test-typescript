import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedMentionLedger } from "./batched-mention-ledger.js";

test("BatchedMentionLedger starts in new", () => {
  const item = newBatchedMentionLedger("code-398", "label-877");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedMentionLedger moves to queued", () => {
  const item = newBatchedMentionLedger("code-398", "label-877");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BatchedMentionLedger rejects moves from failed", () => {
  const item = newBatchedMentionLedger("code-398", "label-877");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
