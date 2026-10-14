import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTicketViewTier } from "./manual-ticket-view-tier.js";

test("ManualTicketViewTier starts in new", () => {
  const item = newManualTicketViewTier("code-770", "name-876");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTicketViewTier moves to queued", () => {
  const item = newManualTicketViewTier("code-770", "name-876");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ManualTicketViewTier rejects moves from failed", () => {
  const item = newManualTicketViewTier("code-770", "name-876");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
