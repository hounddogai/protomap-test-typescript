import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedRetentionAllocation } from "./capped-retention-allocation.js";

test("CappedRetentionAllocation starts in requested", () => {
  const item = newCappedRetentionAllocation("code-770", "label-86");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedRetentionAllocation moves to revoked", () => {
  const item = newCappedRetentionAllocation("code-770", "label-86");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("CappedRetentionAllocation rejects moves from expired", () => {
  const item = newCappedRetentionAllocation("code-770", "label-86");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
