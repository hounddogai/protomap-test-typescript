import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPathQuota } from "./batched-path-quota.js";

test("BatchedPathQuota starts in proposed", () => {
  const item = newBatchedPathQuota("code-515", "name-7");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPathQuota moves to rejected", () => {
  const item = newBatchedPathQuota("code-515", "name-7");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("BatchedPathQuota rejects moves from withdrawn", () => {
  const item = newBatchedPathQuota("code-515", "name-7");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
