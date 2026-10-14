import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchSlot } from "./branch-slot.js";

test("BranchSlot starts in requested", () => {
  const item = newBranchSlot("code-895", "name-358");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchSlot moves to revoked", () => {
  const item = newBranchSlot("code-895", "name-358");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("BranchSlot rejects moves from expired", () => {
  const item = newBranchSlot("code-895", "name-358");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
