import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingReputationSlot } from "./pending-reputation-slot.js";

test("PendingReputationSlot starts in requested", () => {
  const item = newPendingReputationSlot("code-591", "label-842");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingReputationSlot moves to revoked", () => {
  const item = newPendingReputationSlot("code-591", "label-842");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PendingReputationSlot rejects moves from expired", () => {
  const item = newPendingReputationSlot("code-591", "label-842");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
