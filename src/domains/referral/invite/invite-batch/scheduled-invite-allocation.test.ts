import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledInviteAllocation } from "./scheduled-invite-allocation.js";

test("ScheduledInviteAllocation starts in idle", () => {
  const item = newScheduledInviteAllocation("code-552", "title-744");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledInviteAllocation moves to warming", () => {
  const item = newScheduledInviteAllocation("code-552", "title-744");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ScheduledInviteAllocation rejects moves from stopped", () => {
  const item = newScheduledInviteAllocation("code-552", "title-744");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
