import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedTierRecord } from "./batched-tier-record.js";

test("BatchedTierRecord starts in draft", () => {
  const item = newBatchedTierRecord("code-334", "label-136");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedTierRecord moves to active", () => {
  const item = newBatchedTierRecord("code-334", "label-136");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BatchedTierRecord rejects moves from closed", () => {
  const item = newBatchedTierRecord("code-334", "label-136");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
