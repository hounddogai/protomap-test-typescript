import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteEstimate } from "./invite-estimate.js";

test("InviteEstimate starts in draft", () => {
  const item = newInviteEstimate("code-914", "label-343");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteEstimate moves to active", () => {
  const item = newInviteEstimate("code-914", "label-343");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("InviteEstimate rejects moves from closed", () => {
  const item = newInviteEstimate("code-914", "label-343");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
