import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryInviteEstimate } from "./primary-invite-estimate.js";

test("PrimaryInviteEstimate starts in proposed", () => {
  const item = newPrimaryInviteEstimate("code-989", "name-16");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryInviteEstimate moves to approved", () => {
  const item = newPrimaryInviteEstimate("code-989", "name-16");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryInviteEstimate rejects moves from withdrawn", () => {
  const item = newPrimaryInviteEstimate("code-989", "name-16");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
