import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledInviteAdjustment } from "./scheduled-invite-adjustment.js";

test("ScheduledInviteAdjustment starts in requested", () => {
  const item = newScheduledInviteAdjustment("code-954", "name-221");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledInviteAdjustment moves to granted", () => {
  const item = newScheduledInviteAdjustment("code-954", "name-221");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledInviteAdjustment rejects moves from expired", () => {
  const item = newScheduledInviteAdjustment("code-954", "name-221");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
