import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPostAllocation } from "./pending-post-allocation.js";

test("PendingPostAllocation starts in proposed", () => {
  const item = newPendingPostAllocation("code-334", "name-350");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPostAllocation moves to approved", () => {
  const item = newPendingPostAllocation("code-334", "name-350");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PendingPostAllocation rejects moves from withdrawn", () => {
  const item = newPendingPostAllocation("code-334", "name-350");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
