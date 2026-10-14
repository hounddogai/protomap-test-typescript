import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackInvitePreference } from "./fallback-invite-preference.js";

test("FallbackInvitePreference starts in requested", () => {
  const item = newFallbackInvitePreference("code-213", "title-290");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackInvitePreference moves to revoked", () => {
  const item = newFallbackInvitePreference("code-213", "title-290");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("FallbackInvitePreference rejects moves from expired", () => {
  const item = newFallbackInvitePreference("code-213", "title-290");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
