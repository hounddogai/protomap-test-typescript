import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedInviteEntry } from "./batched-invite-entry.js";

test("BatchedInviteEntry starts in planned", () => {
  const item = newBatchedInviteEntry("code-716", "label-99");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedInviteEntry moves to cancelled", () => {
  const item = newBatchedInviteEntry("code-716", "label-99");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("BatchedInviteEntry rejects moves from cancelled", () => {
  const item = newBatchedInviteEntry("code-716", "label-99");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
