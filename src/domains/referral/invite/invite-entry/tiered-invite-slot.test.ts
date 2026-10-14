import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredInviteSlot } from "./tiered-invite-slot.js";

test("TieredInviteSlot starts in open", () => {
  const item = newTieredInviteSlot("code-105", "label-86");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredInviteSlot moves to resolved", () => {
  const item = newTieredInviteSlot("code-105", "label-86");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("TieredInviteSlot rejects moves from archived", () => {
  const item = newTieredInviteSlot("code-105", "label-86");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
